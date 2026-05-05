"use client";

import { useState, useEffect, useRef } from "react";
import { SimulationResult, PlaybackState } from "./editorTypes";

/**
 * Custom hook: จัดการ Simulation Playback Loop ทั้งหมด
 * — isSimulating, simulationResult, playbackState
 * — startSimulation / stopSimulation
 */
export function useSimulation(speed: number, blocks: any[]) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const timeSinceLastSourceEmitRef = useRef(0);

  // =============== SIMULATION PLAYBACK LOOP ===============
  useEffect(() => {
    let tickTimerId: NodeJS.Timeout;

    if (!isSimulating || !simulationResult || simulationResult.mode !== "realtime") {
      return;
    }

    const { steps, target_output } = simulationResult;
    const TICK_MS = 50;

    // Initial setup
    const initialMachineStates: Record<number, any> = {};
    const processSteps = steps.filter(s => s.type !== 'start' && s.type !== 'end');

    processSteps.forEach(s => {
      initialMachineStates[s.step_order] = {
        step_order: s.step_order,
        queue: 0,
        timeRemaining: 0,
        status: 'idle',
        progress: 0,
        cycle: 0
      };
    });

    let currentCost = playbackState?.cost ?? 0;
    let currentElec = playbackState?.electricity ?? 0;
    let currentDuration = playbackState?.duration ?? 0;
    let completedItems = playbackState?.currentProduce ?? 0;
    let localStates = playbackState?.machineStates ? JSON.parse(JSON.stringify(playbackState.machineStates)) : { ...initialMachineStates };

    let itemsInSystem = 0;
    Object.values(localStates).forEach((s: any) => {
      itemsInSystem += s.queue;
      if (s.status !== 'idle') itemsInSystem += 1;
    });
    let sourceItems = target_output - completedItems - itemsInSystem;

    const QUEUE_LIMIT = 10;
    const totalCostPerUnit = (simulationResult.total_cost || 0) / target_output;
    const totalElecPerUnit = (simulationResult.total_electricity || 0) / target_output;

    // รีเซ็ตค่าหากเป็นการเริ่มต้น Simulation ใหม่จริงๆ
    if (!playbackState || (playbackState.currentProduce === 0 && playbackState.duration === 0)) {
      timeSinceLastSourceEmitRef.current = 0;
    }

    const runTick = () => {
      if (!isSimulating) return;

      let rev = 0;
      let net = 0;
      if (simulationResult.selling_price_per_unit) {
        rev = completedItems * simulationResult.selling_price_per_unit;
        net = rev - currentCost;
      }

      if (completedItems >= target_output) {
        setIsSimulating(false);
        // keep final state to show results
        setPlaybackState({
          currentProduce: completedItems,
          cost: currentCost,
          electricity: currentElec,
          duration: currentDuration,
          machineStates: { ...localStates },
          revenue: rev,
          netProfit: net,
          sourceProgress: 0
        });
        return;
      }

      // time step scaled by speed
      const timeStep = TICK_MS * speed;
      let remainingTimeInTick = timeStep;
      const SIM_CHUNKS = 50; // max 50ms chunks to maintain accuracy
      let dynamicEmitInterval = 0;

      while (remainingTimeInTick > 0 && completedItems < target_output) {
        const chunkTime = Math.min(remainingTimeInTick, SIM_CHUNKS);
        remainingTimeInTick -= chunkTime;

        // 1. Process items in machines (Subtract time)
        processSteps.forEach(step => {
          const state = localStates[step.step_order];
          const stepDurationMs = (step.duration || 0.5) * 1000;

          if (state.status === 'working') {
            state.timeRemaining -= chunkTime;
            if (state.timeRemaining <= 0) {
              state.status = 'blocked';
              state.timeRemaining = 0; // It will push out in step 2
            }
            state.progress = Math.max(0, Math.min(1, 1 - (state.timeRemaining / stepDurationMs)));
          }
        });

        // 2. Move items out of blocked machines if next has space
        for (let i = processSteps.length - 1; i >= 0; i--) {
          const step = processSteps[i];
          const state = localStates[step.step_order];

          if (state.status === 'blocked') {
            if (i === processSteps.length - 1) {
              // Last machine outputs product
              state.status = 'idle';
              state.progress = 0;
              completedItems++;
              currentCost += totalCostPerUnit;
              currentElec += totalElecPerUnit;
            } else {
              const nextStep = processSteps[i + 1];
              const nextState = localStates[nextStep.step_order];
              if (nextState.queue < QUEUE_LIMIT) {
                state.status = 'idle';
                state.progress = 0;
                nextState.queue++;
              }
            }
          }
        }

        // 3. Feed Source into first machine
        if (sourceItems > 0 && processSteps.length > 0) {
          timeSinceLastSourceEmitRef.current += chunkTime;
          const firstStepDurationMs = (processSteps[0].duration || 0.5) * 1000;
          // ปล่อยของเร็วกว่าความเร็วเครื่องแรก 20% เพื่อให้สายพานทำงานต่อเนื่องและคิวค่อยๆ ขยับ
          dynamicEmitInterval = firstStepDurationMs * 0.8;

          if (timeSinceLastSourceEmitRef.current >= dynamicEmitInterval) {
            const firstState = localStates[processSteps[0].step_order];
            if (firstState.queue < QUEUE_LIMIT) {
              firstState.queue++;
              sourceItems--;
              timeSinceLastSourceEmitRef.current = 0;
            } else {
              // ถ้าคิวเต็ม ก็ยังไม่ปล่อยของ (แต่ไม่รีเซ็ตเวลา)
            }
          }
        }

        // 4. Start processing items in idle machines
        processSteps.forEach(step => {
          const state = localStates[step.step_order];
          const stepDurationMs = (step.duration || 0.5) * 1000;

          if (state.status === 'idle' && state.queue > 0) {
            state.queue--;
            state.status = 'working';
            state.timeRemaining = stepDurationMs;
            state.progress = 0;
            state.cycle = (state.cycle || 0) + 1;
          }
        });
      }

      currentDuration += timeStep / 1000;

      // คำนวณ sourceProgress สำหรับจุดเหลืองเส้น Start→M1
      const srcProg = dynamicEmitInterval > 0 ? Math.min(1, timeSinceLastSourceEmitRef.current / dynamicEmitInterval) : 0;
      
      setPlaybackState({
        currentProduce: completedItems,
        cost: currentCost,
        electricity: currentElec,
        duration: currentDuration,
        machineStates: { ...localStates },
        sourceProgress: srcProg,
        revenue: rev,
        netProfit: net,
      });
    };

    tickTimerId = setInterval(runTick, TICK_MS);

    return () => clearInterval(tickTimerId);
  }, [isSimulating, simulationResult, speed, blocks]);

  /** เริ่ม Simulation ใหม่จาก result ที่ได้จาก API */
  const startSimulation = (result: SimulationResult) => {
    setSimulationResult(result);
    if (result.mode === "realtime") {
      setPlaybackState({ currentProduce: 0, cost: 0, electricity: 0, duration: 0, sourceProgress: 0, revenue: 0, netProfit: 0 });
      setIsSimulating(true);
    } else {
      setPlaybackState(null);
      setIsSimulating(false);
    }
  };

  /** หยุด Simulation */
  const stopSimulation = () => setIsSimulating(false);

  return {
    isSimulating,
    simulationResult,
    playbackState,
    startSimulation,
    stopSimulation,
  };
}

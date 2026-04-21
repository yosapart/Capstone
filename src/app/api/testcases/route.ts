import { NextResponse } from "next/server";
import { supabase } from "@/lib/db";

export async function GET() {
  try {
    const { data: testcases, error } = await supabase
      .from("testcases")
      .select("*")
      .order("tc_id", { ascending: true });

    if (error) {
      console.error("Supabase Error fetching testcases:", error);
      return NextResponse.json({ message: "เกิดข้อผิดพลาดในการดึง Testcase" }, { status: 500 });
    }

    return NextResponse.json(testcases);
  } catch (error) {
    console.error("Error fetching testcases:", error);
    return NextResponse.json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" }, { status: 500 });
  }
}

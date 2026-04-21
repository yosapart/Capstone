const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('c:/Users/yosapart/OneDrive/Desktop/Cap/factory-sim/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val) env[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function updateTestcase() {
  console.log("Updating testcase 'คนงานลดลง'...");
  const { data, error } = await supabase
    .from('testcases')
    .update({ value: 0.5, description: 'ลดคนงาน 50%' })
    .eq('tc_id', 1)
    .select();

  if (error) {
    console.error("Error updating:", error);
  } else {
    console.log("Updated successfully:", data);
  }
}

updateTestcase();

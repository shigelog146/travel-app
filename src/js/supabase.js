console.log("database.js 読み込み成功");

// ===========================
// 旅行ログ取得
// ===========================
async function getTravelLogs(userId) {
  const { data, error } = await supabaseClient
    .from("travel_logs")
    .select("*")
    .eq("user_id", userId)
    .order("gps_time", {
      ascending: true,
    });

  return {
    data,
    error,
  };
}
window.getTravelLogs = getTravelLogs;

// ===========================
// 旅行ログ保存
// ===========================

async function saveTravelLog(logData) {
  const { data, error } = await supabaseClient
    .from("travel_logs")
    .insert(logData)
    .select();

  return {
    data,
    error,
  };
}

window.saveTravelLog = saveTravelLog;

// ===========================
// 旅行ログ削除
// ===========================

async function deleteTravelLog(id) {
  const { error } = await supabaseClient
    .from("travel_logs")
    .delete()
    .eq("id", id);

  return {
    error,
  };
}

window.deleteTravelLog = deleteTravelLog;

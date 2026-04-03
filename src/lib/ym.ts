const YM_ID = 108386705;

export function ymGoal(target: string, params?: Record<string, unknown>) {
  if (window.ym) {
    window.ym(YM_ID, "reachGoal", target, params);
  }
}

export default ymGoal;

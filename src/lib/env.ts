export function getServerEnv() {
  return {
    idealPostcodesApiKey: process.env.IDEAL_POSTCODES_API_KEY?.trim() ?? "",
  };
}

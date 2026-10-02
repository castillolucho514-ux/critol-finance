const mobileBuild = process.env.CAPACITOR_BUILD === "1";

export default {
  output: mobileBuild ? "export" : "standalone",
  ...(mobileBuild ? { images: { unoptimized: true } } : {}),
};

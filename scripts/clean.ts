import * as del from "del";

const dir = "./public";
(async () => {
  try {
    await del(dir);
    console.log(`Removed "${dir}"`);
  } catch (error) {
    console.error(`Error while deleting path "${dir}". More info below.`);
  } finally {
    console.log();
  }
})();

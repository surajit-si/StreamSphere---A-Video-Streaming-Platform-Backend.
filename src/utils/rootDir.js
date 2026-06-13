import path from "path";

function rootdir(...paths) {
  //     Rest parameter
  return path.join(process.cwd(), ...paths);
}

export default rootdir;

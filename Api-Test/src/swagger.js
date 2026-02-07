import fs from "fs";
import yaml from "js-yaml";

const swaggerDocument = yaml.load(fs.readFileSync("./docs/swagger.yaml", "utf8"));

export default swaggerDocument;

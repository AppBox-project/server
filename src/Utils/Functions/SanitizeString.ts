import validator from "validator";

const sanitizeString = (str) => validator.escape(str);

export default sanitizeString;

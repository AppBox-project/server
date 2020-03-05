import nunjucks from "../Utils/nunjucks";

// Todo nunjucks issues a warning about code injection

export default {
  parseFormula: (formula, data) => {
    return nunjucks.renderString(formula, data);
  }
};

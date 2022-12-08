module.exports = {
  env: {
    node: true,
  },
  extends: ["eslint:recommended", "plugin:vue/vue3-essential", "prettier"],
  rules: {
    "vue/max-len": [
      "error",
      {
        code: 120,
        template: 200,
        tabWidth: 2,
        comments: 120,
      },
    ],
  },
};

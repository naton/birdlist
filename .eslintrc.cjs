module.exports = {
  env: {
    node: true,
  },
  extends: ["eslint:recommended", "plugin:vue/vue3-essential"],
  rules: {
    "vue/max-len": [
      "error",
      {
        code: 150,
        template: 600,
        tabWidth: 2,
        comments: 150,
      },
    ],
  },
};

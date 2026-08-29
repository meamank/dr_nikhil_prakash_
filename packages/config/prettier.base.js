/** @type {import("prettier").Config} */
const config = {
  semi: false,
  singleQuote: false,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "cva"],
}

export default config

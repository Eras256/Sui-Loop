/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'neon-cyan': '#00f3ff',
                'neon-purple': '#bd00ff',
                'neon-green': '#00ff9d',
            },
        },
    },
    plugins: [],
}

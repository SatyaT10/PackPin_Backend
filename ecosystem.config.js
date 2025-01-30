module.exports = {
    apps: [
        {
            name: "PackPin_Backend",
            script: "index.js",
            watch: true, // Enable watch mode
            ignore_watch: ["node_modules", "logs", "Images"], // Ignore these directories
        },
    ],
};
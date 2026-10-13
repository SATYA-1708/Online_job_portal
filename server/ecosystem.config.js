module.exports = {
    apps: [
        {
            name: 'techsparkx-server',
            script: './index.js',
            instances: 'max', // or a specific number of instances
            exec_mode: 'cluster',
            env_development: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
                PORT: 5000,
            }
        }
    ]
};

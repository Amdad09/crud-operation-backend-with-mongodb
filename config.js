const requireEnv = (name) => {
    const result = process.env[name];
    if (!result) throw new Error(`${name} is reqired!`);
    return result;
};

export const config = {
    port: requireEnv('PORT'),
    mongoUrl: requireEnv('MONGODB_URI'),
};
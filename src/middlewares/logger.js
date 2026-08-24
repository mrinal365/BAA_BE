export const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  const start = process.hrtime();

  // async log 
  res.on('finish', () => {
    setImmediate(() => {
      const diff = process.hrtime(start);
      const timeInMs = ((diff[0] * 1e9 + diff[1]) / 1e6).toFixed(2);

      const method = req.method;
      const url = req.originalUrl || req.url;
      const status = res.statusCode;

      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      if (ip === '::1') {
        ip = '127.0.0.1';
      } else if (ip && ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
      }

      console.log(`${method} ${url} - Status: ${status} - IP: ${ip} - Time: ${timeInMs} ms`);
    });
  });

  next();
};

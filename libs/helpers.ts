export const getUrl = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ?? // * Production URL
    process.env.NEXT_PUBLIC_VERCEL_URL ?? // * Vercel Auto URL
    'http://localhost:3000/'; // * Dev

  // * Adds https when not in development
  url = url.includes('http') ? url : `https://${url}`;

  // * Adds trailing / if not there
  url = url.charAt(url.length - 1) === '/' ? url : `${url}/`;
  return url;
};

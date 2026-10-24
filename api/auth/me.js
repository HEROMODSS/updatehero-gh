import { checkAuth } from '../_lib.js';

export default function handler(req, res) {
  res.status(200).json({ loggedIn: checkAuth(req) });
}

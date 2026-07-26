import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	experimental: {
		staleTimes: {
			dynamic: 0,
			static: 30,
		},
	},
};

export default nextConfig;

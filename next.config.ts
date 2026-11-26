import type { NextConfig } from "next";

const config: NextConfig = {
  async headers() {
    return [{
      source: "/join",
      headers: [
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "Cache-Control", value: "private, no-store" },
      ],
    }];
  },
};

export default config;

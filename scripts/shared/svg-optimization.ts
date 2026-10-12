import { optimize } from "svgo";

export const optimizeShieldSvg = (content: string, sourcePath: string): string => {
  const result = optimize(content, {
    path: sourcePath,
    multipass: true,
    plugins: [
      {
        name: "preset-default",
        params: {
          overrides: {
            // Municipal source files carry Commons license and creator data.
            removeComments: false,
            removeMetadata: false,
            removeEditorsNSData: false,
            removeTitle: false,
            removeDesc: false,
            removeViewBox: false,
          },
        },
      },
      "removeDimensions",
      {
        name: "addAttributesToSVGElement",
        params: { attributes: [{ xmlns: "http://www.w3.org/2000/svg" }] },
      },
    ],
  });

  return result.data;
};

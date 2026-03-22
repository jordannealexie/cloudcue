export type EmbedResult =
  | { type: "youtube"; videoId: string; iframeUrl: string }
  | { type: "figma"; iframeUrl: string }
  | {
      type: "bookmark";
      url: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      favicon?: string;
    };

export const parseEmbedUrl = (url: string): EmbedResult => {
  const youtubeMatch =
    url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/) ??
    url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);

  if (youtubeMatch?.[1]) {
    return {
      type: "youtube",
      videoId: youtubeMatch[1],
      iframeUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`
    };
  }

  if (/figma\.com\/(file|proto)\//.test(url)) {
    return {
      type: "figma",
      iframeUrl: `https://www.figma.com/embed?embed_host=cloudcue&url=${encodeURIComponent(url)}`
    };
  }

  return {
    type: "bookmark",
    url
  };
};

export const fetchBookmarkMetadata = async (url: string): Promise<EmbedResult> => {
  const response = await fetch(`/api/embed/meta?url=${encodeURIComponent(url)}`, {
    credentials: "include"
  });

  if (!response.ok) {
    return { type: "bookmark", url };
  }

  const payload = (await response.json()) as {
    data?: {
      type?: "bookmark";
      url?: string;
      title?: string;
      description?: string;
      imageUrl?: string;
      favicon?: string;
    };
  };

  return {
    type: "bookmark",
    url: payload.data?.url ?? url,
    title: payload.data?.title,
    description: payload.data?.description,
    imageUrl: payload.data?.imageUrl,
    favicon: payload.data?.favicon
  };
};

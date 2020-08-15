import { URL } from 'url';

const youtubeVideoIDRe = /^([A-Za-z0-9_-]){11}$/;

export const linkFromId = (id: string): string => `https://www.youtube.com/watch?v=${id}`;

export const isVideoId = (id: string): boolean => youtubeVideoIDRe.test(id);

export const isYoutubeUrl = (link: string): boolean => {
  const url = new URL(link);
  const host = url.hostname.replace(/(^(?:https?:\/\/)?www\d*\.)/, '');
  return host.startsWith('youtube.com') || host.startsWith('youtu.be');
};

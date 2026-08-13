/* Minimal ambient types for the untyped `web-push` package (used in push.ts). */
declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys: Record<string, string>;
  }
  const webpush: {
    setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
    sendNotification(subscription: PushSubscription, payload: string): Promise<unknown>;
  };
  export default webpush;
}

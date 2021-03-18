const webpush = require("web-push");
import { map } from "lodash";

export default class PushNotificationSender {
  notificationSettings: {
    gcmAPIKey: string;
    vapid: { publicKey: string; privateKey: string; subject: string };
  };
  pushLibConfig;
  pusher;

  constructor(models) {
    models.systemsettings.findOne({ key: "notification" }).then((result) => {
      if (!result) {
        // No notification settings found. Generate new VAPID keys.
        const vapid = webpush.generateVAPIDKeys();
        const notificationSettings = new models.systemsettings({
          key: "notification",
          value: { vapid },
        });
        notificationSettings.save().then((r) => {
          this.notificationSettings = r.value;
          this.listenForNotifications(models);
        });
      } else {
        this.notificationSettings = result.value;
        this.listenForNotifications(models);
      }
    });
  }

  listenForNotifications = async (models) => {
    webpush.setVapidDetails(
      this.notificationSettings.vapid.subject ||
        "https://appbox.io/error/no-vapid-subject",
      this.notificationSettings.vapid.publicKey,
      this.notificationSettings.vapid.privateKey
    );

    models.objects.stream.on("change", async (dbChange) => {
      if (dbChange.operationType === "insert") {
        if (dbChange.fullDocument.objectId === "notifications") {
          // Fetch subscriptions
          const userSubscriptions = await models.usersettings.model.findOne({
            key: "notificationSubscriptions",
            user: dbChange.fullDocument.data.user,
          });

          // Despatch notifications
          map(userSubscriptions.value, (subscription, key) => {
            const payload = JSON.stringify({
              title: dbChange.fullDocument.data.title,
              content: dbChange.fullDocument.data.content,
              icon:
                "https://e7.pngegg.com/pngimages/21/284/png-clipart-brown-box-illustration-cardboard-box-icon-cardboard-box-miscellaneous-angle.png",
            });

            webpush.sendNotification(subscription, payload).catch((error) => {
              console.error(error.stack);
            });
          });
        }
      }
    });
  };
}

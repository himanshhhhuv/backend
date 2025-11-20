export const sendEmail = async ({ to, subject, text }) => {
  console.log(Sending email to  with subject );
  return true;
};

export const sendInAppNotification = async ({ userId, message }) => {
  console.log(In-app notification to : );
  return true;
};


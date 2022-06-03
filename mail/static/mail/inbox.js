import FetchWrapper from "./fetch-wrapper.js";

const API = new FetchWrapper("/emails");
let emailList;
const replyEmail = {};

document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  emailList = document.querySelector("#emails-view-list");

  document
    .querySelector("#email-view-reply")
    .addEventListener("click", reply_email);

  document
    .querySelector("#email-view-archive")
    .addEventListener("click", toggleArchive);

  document
    .querySelector("#compose-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      console.log("mail submitted");

      let from = document.querySelector("#compose-sender").value;
      let to = document.querySelector("#compose-recipients").value;
      let subject = document.querySelector("#compose-subject").value;
      let body = document.querySelector("#compose-body").value;

      console.log(`${from} : ${to} : ${subject} : ${body}`);

      API.post("", {
        recipients: to,
        subject: subject,
        body: body,
      })
        .then((res) => {
          console.log(`res:${JSON.stringify(res)}`);
          if (res["message"]) {
            console.log("message sent success");
            load_mailbox("sent");
          }
          if (res["error"]) {
            console.log("something went wrong");
            document.querySelector("#compose-message").textContent =
              "something went wrong. message was not sent";
          }
        })
        .catch((error) => console.log(`error: ${error}`));
    });

  // By default, load the inbox
  load_mailbox("inbox");
});

function toggleArchive() {
  console.log(`archive: ${replyEmail["archived"]}`);
  fetch(`/emails/${replyEmail["id"]}`, {
    method: "PUT",
    body: JSON.stringify({
      archived: !replyEmail["archived"],
    }),
  });

  // API.put(`/${replyEmail["id"]}`, {
  //  archived: !replyEmail["archived"],
  //})
  //  .then((data) => console.log(data))
  //  .catch((error) => console.error(error));

  replyEmail["archived"] = !replyEmail["archived"];
  document.querySelector("#email-view-archive").textContent = replyEmail[
    "archived"
  ]
    ? "Unarchive"
    : "Archive";
}

function reply_email() {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  document.querySelector("#compose-message").textContent = "";
  document.querySelector("#compose-recipients").value =
    replyEmail["recipients"];
  document.querySelector("#compose-subject").value =
    "Re: " + replyEmail["subject"];
  document.querySelector(
    "#compose-body"
  ).value = `On ${replyEmail["timestamp"]} ${replyEmail["sender"]} wrote: ${replyEmail["body"]}`;
}

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
  document.querySelector("#compose-message").textContent = "";
}

function handleMailClicked(id, mailbox) {
  load_mail(id, mailbox);
}

function load_mail(id, mailbox) {
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#email-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  if (mailbox === "sent") {
    document.querySelector("#email-view-archive").style.display = "none";
  } else {
    document.querySelector("#email-view-archive").style.display = "";
  }

  API.get(`/${id}`)
    .then((data) => {
      console.log(data);
      document.querySelector("#email-view-from").textContent = data.sender;
      replyEmail["sender"] = data.sender;
      document.querySelector("#email-view-to").textContent = data.recipients;
      replyEmail["recipients"] = data.recipients;
      document.querySelector("#email-view-subject").textContent = data.subject;
      replyEmail["subject"] = data.subject;
      document.querySelector("#email-view-timestamp").textContent =
        data.timestamp;
      replyEmail["timestamp"] = data.timestamp;
      document.querySelector("#email-view-body").textContent = data.body;
      replyEmail["body"] = data.body;
      replyEmail["id"] = data.id;
      replyEmail["archived"] = data.archived;
      document.querySelector("#email-view-archive").textContent = data.archived
        ? "Unarchive"
        : "Archive";
    })
    .catch((error) => {
      console.log(error);
    });
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  let nameOnMailButton;

  API.get(`/${mailbox}`)
    .then((data) => {
      //console.log(data);
      if (data.length === 0) {
        emailList.textContent = "There is no message";
      } else {
        emailList.textContent = "";
      }
      data.forEach((element) => {
        //console.log(element);
        const childElement = document.createElement("button");
        childElement.classList.add("btn");
        if (element.read) {
          childElement.classList.add("btn-secondary");
        } else {
          childElement.classList.add("btn-outline-secondary");
        }

        nameOnMailButton =
          mailbox === "sent" ? element.recipients[0] : element.sender;
        childElement.innerHTML = `<strong>${nameOnMailButton}</strong> ${element.subject} ${element.timestamp}`;
        childElement.addEventListener("click", () => {
          handleMailClicked(element.id, mailbox);
        });
        emailList.appendChild(childElement);
      });
    })
    .catch((error) => console.error(error));

  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#email-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view-title").textContent = `${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }`;
}

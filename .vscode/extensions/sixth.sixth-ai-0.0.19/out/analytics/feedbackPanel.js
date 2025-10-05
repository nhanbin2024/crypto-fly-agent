"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFeedBackPopUp = createFeedBackPopUp;
exports.handleFeedbackPopUP = handleFeedbackPopUP;
exports.getUserSurveyStatus = getUserSurveyStatus;
exports.sendUserSurveyStatus = sendUserSurveyStatus;
exports.createRatingPopUp = createRatingPopUp;
exports.handleRatingPopUp = handleRatingPopUp;
exports.getUserRatingStatus = getUserRatingStatus;
exports.sendUserRating = sendUserRating;
exports.createSixthJoinCommunityModal = createSixthJoinCommunityModal;
exports.handleSixthJoinCommunityModal = handleSixthJoinCommunityModal;
exports.createRatingCodeFixPopUp = createRatingCodeFixPopUp;
exports.handleRatingCodeFixPopUp = handleRatingCodeFixPopUp;
exports.getUserRatingCodeFixStatus = getUserRatingCodeFixStatus;
exports.sendUserRatingCodeFix = sendUserRatingCodeFix;
exports.createInAppPopUp = createInAppPopUp;
exports.handleInAppPopUP = handleInAppPopUP;
exports.sendUserInAppSurvey = sendUserInAppSurvey;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const projectUtils_1 = require("../utils/projectUtils");
const genUtils_1 = require("../utils/genUtils");
function createFeedBackPopUp(context, onSuccess) {
    const header = "Hey Sixth user! Got a sec? Help us make Sixth even better! Click here to share your thoughts in a quick survey. Thanks a bunch! 🚀";
    const options = {
        detail: "Hey Sixth user! Got a sec? Help us make Sixth even better! Click here to share your thoughts in a quick survey. Thanks a bunch! 🚀",
        modal: false,
    };
    var surveyUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfc4LUI0Tj1zh42PgLKfMvEk-kngYESlW1ssvDfWKeTTczmoA/formrestricted";
    vscode.window
        .showInformationMessage(header, options, ...["yes i would"])
        .then((item) => {
        if (item === "yes i would") {
            //has taken survey
            //saveDataToCache(context, SURVEY_MADE, true);
            sendUserSurveyStatus(context, true);
            vscode.env.openExternal(vscode.Uri.parse(surveyUrl));
        }
    });
}
function handleFeedbackPopUP(context, onSuccess) {
    new Promise((resolve, reject) => {
        // Your background task logic here
        getUserSurveyStatus(context);
        // Resolve the Promise when the task is complete
        resolve();
    }).then(() => {
    }).catch(error => {
        // Handle any errors that occur during the task execution
    });
}
function getUserSurveyStatus(context) {
    var url = `https://backend.withsix.co/feedback/get_survey?apiKey=${(0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, "")}`;
    axios_1.default
        .get(url)
        .then((response) => {
        if (response.data["data"]["survey"] === false) {
            createFeedBackPopUp(context, () => { });
        }
        (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.SURVEY_MADE, response.data["data"]["survey"]);
        //handleFeedbackPopUP(context, () => {});
    })
        .catch((error) => { });
}
function sendUserSurveyStatus(context, status) {
    var url = "https://mailing.trysixth.com/user_fills_survey";
    var body = {
        "user_id": (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, "")
    };
    axios_1.default
        .post(url, body)
        .then((response) => {
        (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.SURVEY_MADE, true);
    })
        .catch((error) => { });
}
function createRatingPopUp(context, onSuccess) {
    /*setTimeout(() => {
      const header = "How would you rate this feature ?";
      const options = {
        detail: "we would like to hear what you think about the diagnostics feature",
        modal: true,
      };
      
      vscode.window
        .showInformationMessage(header, options, ...["1", "2", "3", "4", "5"])
        .then((item) => {
          if (item) {
            sendUserRating(context,item);
  
          }
        });
    }, 5000);*/
    const header = "How would you rate this feature ?";
    const options = {
        detail: "we would like to hear what you think about the diagnostics feature",
        modal: true,
    };
    vscode.window
        .showInformationMessage(header, options, ...["1", "2", "3", "4", "5"])
        .then((item) => {
        if (item) {
            sendUserRating(context, item);
        }
    });
}
function handleRatingPopUp(context, onSuccess) {
    //console.log(getDataFromCache(context, RATING_MADE, null),"kilode oh!!!");
    if ((0, projectUtils_1.getDataFromCache)(context, projectUtils_1.RATING_MADE, null) === false) {
        createRatingPopUp(context, () => { });
    }
    else if ((0, projectUtils_1.getDataFromCache)(context, projectUtils_1.RATING_MADE, null) === null) {
        createRatingPopUp(context, () => { });
    }
}
function getUserRatingStatus(context) {
    var url = `https://backend.withsix.co/feedback/get_rating?apiKey=${(0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, "")}`;
    axios_1.default
        .get(url)
        .then((response) => {
        if (response.status === 200) {
            (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.RATING_MADE, true);
        }
        //handleFeedbackPopUP(context, () => {});
    })
        .catch((error) => {
        if (error.response && error.response.status === 404) {
            (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.RATING_MADE, false);
        }
    });
}
function sendUserRating(context, rating) {
    var url = "https://backend.withsix.co/feedback/rating";
    var body = {
        apikey: (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, ""),
        "rating_value": rating
    };
    axios_1.default
        .post(url, body)
        .then((response) => {
        (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.RATING_MADE, true);
    })
        .catch((error) => { });
}
function createSixthJoinCommunityModal(context, onSuccess) {
    const header = "Hey there,join our community";
    const options = {
        detail: "Join our Discord/Reddit community to connect with other users, get help, and have fun! Click to join now. See you there! 🚀",
        modal: true,
    };
    var discordUrl = "https://discord.gg/5UAhbwTpu3";
    var redditUrl = "https://www.reddit.com/r/sixthCommunity/";
    vscode.window
        .showInformationMessage(header, options, ...["Discord", "Reddit"])
        .then((item) => {
        if (item === "Discord") {
            //has taken survey
            (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.JOIN_COMMUNITY, true);
            vscode.env.openExternal(vscode.Uri.parse(discordUrl));
        }
        if (item === "Reddit") {
            //has taken survey
            (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.JOIN_COMMUNITY, true);
            vscode.env.openExternal(vscode.Uri.parse(redditUrl));
        }
    });
}
function handleSixthJoinCommunityModal(context, onSuccess) {
    if ((0, projectUtils_1.getDataFromCache)(context, projectUtils_1.JOIN_COMMUNITY, null) === false || (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.JOIN_COMMUNITY, null) === null) {
        createSixthJoinCommunityModal(context, () => { });
    }
}
;
/* CODE FIX POP UP */
function createRatingCodeFixPopUp(context, onSuccess) {
    const header = "How would you rate the code fix feature ?";
    const options = {
        detail: "we would like to hear what you think about the code fix feature you just used",
        modal: true,
    };
    vscode.window
        .showInformationMessage(header, options, ...["1", "2", "3", "4", "5"])
        .then((item) => {
        if (item) {
            sendUserRatingCodeFix(context, item);
        }
    });
}
function handleRatingCodeFixPopUp(context, onSuccess) {
    console.log("welp!", (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.CODEFIX_RATING_MADE, null));
    //console.log(getDataFromCache(context, RATING_MADE, null),"kilode oh!!!");
    if ((0, projectUtils_1.getDataFromCache)(context, projectUtils_1.CODEFIX_RATING_MADE, null) === false) {
        getUserRatingCodeFixStatus(context);
    }
    else if ((0, projectUtils_1.getDataFromCache)(context, projectUtils_1.CODEFIX_RATING_MADE, null) === null) {
        getUserRatingCodeFixStatus(context);
    }
}
function getUserRatingCodeFixStatus(context) {
    var url = `https://backend.withsix.co/analytics/get_user_total_codefix_analytics?apikey=${(0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, "")}`;
    //console.log("help me welp!");
    axios_1.default
        .get(url)
        .then((response) => {
        if (response.status === 200) {
            //console.log(response.data,"help welp welp!");
            if (response.data["total_count"] >= 1) {
                createRatingCodeFixPopUp(context, () => { (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.CODEFIX_RATING_MADE, true); });
            }
            else {
                (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.CODEFIX_RATING_MADE, false);
            }
        }
        //handleFeedbackPopUP(context, () => {});
    })
        .catch((error) => {
        if (error.response && error.response.status === 404) {
            //console.log(error,"help me welp!");
            (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.CODEFIX_RATING_MADE, false);
        }
    });
}
function sendUserRatingCodeFix(context, rating) {
    var url = "https://backend.withsix.co/feedback/codefix/rating";
    var body = {
        apikey: (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, ""),
        "rating_value": rating
    };
    axios_1.default
        .post(url, body)
        .then((response) => {
        (0, projectUtils_1.saveDataToCache)(context, projectUtils_1.CODEFIX_RATING_MADE, true);
    })
        .catch((error) => { });
}
/* IN APP SURVEY AND NOTIFICATION POP UP */
function createInAppPopUp(context, name, message, bool, info, onSuccess) {
    if (info === false) {
        if (bool === false) {
            const userInput = vscode.window.showInputBox({
                prompt: message, // Header-like message
                placeHolder: 'type here...',
                value: '', // Optional: initial value of the input box
                ignoreFocusOut: true, // Optional: allow input box to remain open even if focus is lost
            });
            Promise.resolve().
                then(() => userInput).
                then(input => {
                if (input !== "" && input !== undefined) {
                    sendUserInAppSurvey(context, name, input);
                }
                else {
                    //vscode.window.showInformationMessage('Pop up cancelled');
                }
            });
        }
        else {
            const header = "Hey Sixth User";
            const options = {
                detail: message,
                modal: false,
            };
            vscode.window
                .showInformationMessage(header, options, ...["yes", "no"])
                .then((item) => {
                if (item === "yes") {
                    sendUserInAppSurvey(context, name, "yes");
                }
                if (item === "no") {
                    sendUserInAppSurvey(context, name, "no");
                }
            });
        }
    }
    else {
        vscode.window.showInformationMessage(message);
    }
}
function handleInAppPopUP(context, onSuccess) {
    new Promise((resolve, reject) => {
        var url = `https://backend.withsix.co/feedback/get_user_pending_in_app_surveys?apikey=${(0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, "")}`;
        //console.log("help me welp!");
        axios_1.default
            .get(url)
            .then((response) => {
            if (response.status === 200) {
                const pendSurveys = response.data["data"];
                if (pendSurveys.length > 0) {
                    let timeCounter = 1;
                    for (let i = 0; i < pendSurveys.length; i++) {
                        (0, genUtils_1.delay)(timeCounter * 60 * 1000).then(() => {
                            createInAppPopUp(context, pendSurveys[i]["name"], pendSurveys[i]["body"], pendSurveys[i]["boolean"], pendSurveys[i]["info"], () => { });
                        });
                        if (timeCounter === 1) {
                            timeCounter = 60;
                        }
                        else {
                            timeCounter = timeCounter * 2;
                        }
                    }
                }
            }
            //handleFeedbackPopUP(context, () => {});
        })
            .catch((error) => {
            if (error.response && error.response.status === 404) {
            }
        });
        // Resolve the Promise when the task is complete
        resolve();
    }).then(() => {
        // Handle completion of the background task
    }).catch(error => {
        // Handle any errors that occur during the task execution
    });
}
function sendUserInAppSurvey(context, name, answer) {
    var url = "https://backend.withsix.co/feedback/add_new_in_app_user_log_survey";
    var body = {
        "user_id": (0, projectUtils_1.getDataFromCache)(context, projectUtils_1.APIKEY, ""),
        "name": name,
        "answer": answer
    };
    axios_1.default
        .post(url, body)
        .then((response) => {
        vscode.window.showInformationMessage('Thanks for filling our survey!');
    })
        .catch((error) => { });
}
//# sourceMappingURL=feedbackPanel.js.map
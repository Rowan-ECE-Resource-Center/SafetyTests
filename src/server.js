
var QUESTIONS_SPREADSHEET_ID = "1aMbrM9llf225flyTBc6VYilygD1UVqzncORPnOlxGws";

function setup() {
    var test_request_form = FormApp.openById("1mgpeGgMHYTU4HBDLLaRxNT4OrHm7aIZHcN09W2z7FhM");
    ScriptApp.newTrigger("");

    var test_generate_form = FormApp.openById("1Op7F5dOdOCj8A8V0gC6FSOU7I1YXOmMRPvBeQYCQfIw");
    ScriptApp.newTrigger("onGenerateTests").forForm(test_generate_form).onFormSubmit().create();
}

function onGenerateTests(event) {

    var responses = event.response.getItemResponses();

    var tests_to_generate = 0;

    responses.forEach(function (response) {
        if (response.getItem().getTitle() === "Tests to generate") {
            tests_to_generate = response.getResponse();
        }
    });

    Logger.log("Generating tests: " + tests_to_generate);

    var questions_sheet = SpreadsheetApp.openById(QUESTIONS_SPREADSHEET_ID);

    // Make into JSON so that eash test uses a deep clone of the questions array
    var questions = JSON.stringify(parseQuestions(questions_sheet));
    Logger.log("All questions: " + questions);

    for (var i = 0; i < tests_to_generate; i++) {
        Logger.log("Generating test: " + i);
        var random_questions = randomizeQuestions(JSON.parse(questions));
        Logger.log("Questions: " + JSON.stringify(random_questions, null, 2));
        generateTest(random_questions);
    }
}


function parseQuestions(questions_spreadsheet) {
    var questions_spreadsheet_header_rows = 3;
    var questions_desired_locaion = 'B2';

    var category_sheets = questions_spreadsheet.getSheets();

    return category_sheets.map(function (sheet) {

        var range = sheet.getRange(questions_spreadsheet_header_rows + 1, 1, sheet.getLastRow() - questions_spreadsheet_header_rows, sheet.getLastColumn());
        var values = range.getValues();

        /*
         *  {
         *      name: Name of the category
         *      desired_questions: Number of questions that should be on a test from this category
         *      questions: A list of questions that could be on the test
         *  }
         */

        return {
            name: sheet.getName(),
            desired_questions: sheet.getRange(questions_desired_locaion).getValue(),
            questions: values.map(function (row) {

                /*
                 *  {
                 *      text: The text of the question
                 *      answers: A list of answers to the question
                 *  }
                 */

                return {
                    text: row[0],
                    answers: row.splice(2, 6).map(function (question, index) {

                        /*
                         *  {
                         *      text: The text of the answer
                         *      correct: whether this is the correct answer
                         *  }
                         */

                        return {
                            text: question,
                            correct: index === row[1]
                        };
                    })
                };
            })
        };
    });
}

function randomizeQuestions(questions) {
    //Logger.log(JSON.stringify(questions, null, 2));
    var randomized_questions = questions.reduce(function (randomized_questions, category) {


        // Shuffle the answers of the questions
        category.questions.forEach(function (question) {
            shuffleArray(question.answers);
        });

        shuffleArray(category.questions);

        return randomized_questions.concat(category.questions.splice(0, category.desired_questions));

    }, []);

    shuffleArray(randomized_questions);

    return randomized_questions;
}

function generateTest(questions) {
    //var form = FormApp.create(name);

    var form_template_file = DriveApp.getFileById("1ryMLer5OjMxFNwRdeXQYH4LYBvIhEIMYSSzwt0UozVQ");
    var form_folder = DriveApp.getFolderById("1F3_wcZWBNw1sQxZjt1Uh4samBZwM-6h6");
    var form_file = form_template_file.makeCopy(form_folder);

    var form = FormApp.openById(form_file.getId());

    var trigger = ScriptApp.newTrigger("onTestFormSubmit").forForm(form).onFormSubmit().create();

    form_file.setName(trigger.getUniqueId());

    form.setIsQuiz(true);
    form.setLimitOneResponsePerUser(true);
    form.setRequireLogin(true);
    form.setShowLinkToRespondAgain(false);
    form.setAcceptingResponses(true);

    questions.forEach(function (question) {
        var item = form.addMultipleChoiceItem();
        item.setRequired(true);
        item.setPoints(1);
        item.setTitle(question.text);
        item.setChoices(question.answers.map(function (answer) {
            return item.createChoice(answer.text, answer.correct);
        }));
    });

    var spreadsheet = SpreadsheetApp.openById("1XEPXTF6wQCmeeJR0K5Z8DDLUYO4O8oAzD60Q-HyNMIo");
    var sheet = spreadsheet.getSheetByName("Log");
    sheet.appendRow([
        trigger.getUniqueId(),
        form.getId(),
        form.getPublishedUrl(),
    ]);
}

function onTestFormSubmit(event) {
    Logger.log("Submitted");

    var spreadsheet = SpreadsheetApp.openById("1XEPXTF6wQCmeeJR0K5Z8DDLUYO4O8oAzD60Q-HyNMIo");
    var sheet = spreadsheet.getSheetByName("Log");
    var range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
    var values = range.getValues();

    var row_number = 0;

    values.forEach(function (row, index) {
        if (row[0] === event.triggerUid) {
            row_number = index;
            Logger.log("Found id");
        }
    });

    Logger.log(row_number);

    var form_id = values[row_number][1];

    Logger.log(form_id);

    var form = FormApp.openById(form_id);

    form.setAcceptingResponses(false);

    var triggers = ScriptApp.getUserTriggers(form);

    triggers.forEach(function (trigger) {
        ScriptApp.deleteTrigger(trigger);
    });

    var earned_points = 0;
    var total_points = 0;

    var gradable_responses = event.response.getGradableItemResponses();
    gradable_responses.forEach(function (response) {
        earned_points += response.getScore();

        var item = response.getItem();

        if (item.getType() == FormApp.ItemType.MULTIPLE_CHOICE){
            var multple_choice_item = item.asMultipleChoiceItem();
            total_points += multple_choice_item.getPoints();
        }
    });

    var score = earned_points / total_points;

    sheet.getRange(row_number + 1, 4).setValue(event.response.getTimestamp());
    sheet.getRange(row_number + 1, 5).setValue(event.response.getRespondentEmail());
    sheet.getRange(row_number + 1, 6).setValue(earned_points);
    sheet.getRange(row_number + 1, 7).setValue(total_points);
    sheet.getRange(row_number + 1, 8).setValue(score);
}

/**
 * Randomize array element order in-place.
 * Using Durstenfeld shuffle algorithm.
 * https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function tests() {
    var questions_spreadsheet = SpreadsheetApp.openById(QUESTIONS_SPREADSHEET_ID);

    var questions = parseQuestions(questions_spreadsheet);
    Logger.log(JSON.stringify(questions, null, 2));

    var random_questions = randomizeQuestions(questions);
    Logger.log(JSON.stringify(random_questions, null, 2));

    generateTest("Testy Testing", random_questions);
}


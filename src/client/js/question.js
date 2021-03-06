
function QuestionList(question_list) {
    var self = this;

    self.element = document.createElement("div");
    self.element.classList += " mb-1 m-3";

    shuffleArray(question_list);

    var questions = [];

    for (var i = question_list.length - 1; i >= 0; i--) {
        var question = question_list[i];

        var question_obj = new Question(question);

        questions.push(question_obj);
        self.element.appendChild(question_obj.element);
    }

    self.getAnswers = function() {
        var question_responses = [];

        for (var i = 0; i < questions.length; i++) {
            var question_obj = questions[i];
            var question_response = question_obj.getAnswer();

            var question = question_obj.question;

            question.response = question_response;

            question_responses.push(question)
        }

        return question_responses;
    }
}

function Question(question) {
    var self = this;

    self.question = question;

    self.element = document.createElement("div");

    // Question title
    var title_element = document.createElement("h5");
    title_element.textContent = question.text;
    title_element.classList += " mb-1 m-3";
    self.element.appendChild(title_element);

    var answers = question.answers;

    shuffleArray(answers);

    for (var i = answers.length - 1; i >= 0; i--) {
        var answer = answers[i];

        var answer_element = document.createElement("div");
        answer_element.classList += " form-check mx-3";

        var check_element = document.createElement("input");
        check_element.classList += " form-check-input ml-0";
        check_element.type = "radio";
        check_element.name = question.category + ":" + question.id;
        check_element.id = question.category + ":" + question.id + ":" + answer.id;
        check_element.value = answer.id;
        answer_element.appendChild(check_element);

        var label_element = document.createElement("label");
        label_element.classList += " form-check-label";
        label_element.htmlFor = check_element.id;
        label_element.textContent = answer.text;
        answer_element.appendChild(label_element);

        self.element.appendChild(answer_element);
    }

    self.getAnswer = function() {
        var answer = null;

        var radios = self.element.querySelectorAll("input[name=\"" + question.category + ":" + question.id + "\"]");
        for (var i = 0; i < radios.length; i++) {
            answer_radio = radios[i];

            if (answer_radio.checked) {
                answer = answer_radio.value;
                break;
            }
        }

        return answer;
    }
}


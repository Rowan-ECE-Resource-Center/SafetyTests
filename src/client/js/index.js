var question1 = new Question({
    text: "Question 1",
    answers: [
        {
            text: "answer 1",
            id: 1
        },
        {
            text: "answer 2",
            id: 2
        }
    ]
});

var questions_element = document.getElementById("questions");
questions_element.appendChild(question1.element);
console.log(questions_element);


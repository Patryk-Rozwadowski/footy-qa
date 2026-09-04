# Take-Home Assignment

You are working on a pipeline responsible for validating the API implementation of the FootyScores application. FootyScores provides football (soccer) match data through a public API.

The goal of this task is to build a front-end tool that helps QA engineers generate and review the expected API endpoint for every football match played during the Paris 2024 Olympic Games. These generated endpoints will serve as reference values for automated tests validating the FootyScores API.

Use the official Olympic Games competition schedule as the source of truth for match data:  
https://stacy.olympics.com/en/paris-2024/competition-schedule

## Your task is to

Design and implement a solution as either:
- a web application, or
- a Chrome extension, or
- CLI

The application should:

- retrieve and process match data from the official Olympic Games competition schedule
- identify and include only football (soccer) matches
- generate the expected API endpoint for each football match using the same structure as in `example.json`
- display the parsed matches and generated endpoints in a clear user interface
- allow the user to export the generated results in a machine-readable format suitable for automated testing

Bonus:
- run automated JSON comparison with the tested API

## Acceptance Criteria

### Functionality
- The solution is accessible through a user interface.
- A user can trigger data loading and endpoint generation through the UI.
- The application displays a list of football matches together with their generated API endpoints.
- The user can export the generated output as JSON.

### Data Source
- Match data is derived from the official Olympic Games competition schedule for Paris 2024.
- The application correctly identifies and processes only football (soccer) matches.

### Endpoint Generation
- Each generated endpoint follows a consistent and well-defined structure, exactly the same as in `example.json`.
- The endpoint uniquely represents a single football match.
- All matches in the schedule are covered with no duplicates or omissions.

### Deterministic Output
- Given the same input data, the application always produces the same output.
- The default output order is predictable and documented, for example sorted by date and kickoff time.

### User Experience
- The UI clearly communicates loading, empty, and error states.
- Generated results are easy to review visually.
- Users can inspect the match data used to build each endpoint.

## Submission Requirements

Please create a repository containing your solution and include clear instructions on how to install, run, and deploy the code. You may submit your work by sharing a GitHub repository link or by providing the solution as a zipped archive.

In your documentation, please also specify:
- how data is retrieved and parsed
- how endpoint ordering is determined
- any assumptions made regarding missing or inconsistent schedule data
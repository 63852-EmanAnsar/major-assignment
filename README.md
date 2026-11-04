# Smart Study Planner (StudyFlow)

## Project Description

Smart Study Planner is a web application that helps students organize and manage their studies in one place. It combines a secure user authentication system, an advanced study timer, a daily task checklist, motivational quotes, a notes manager, and a subject-wise progress tracker. This allows students to stay focused, track their progress, and manage their time effectively.

## Features


1. **User Authentication & Dashboard (Anfal):**
   - Built a secure Login and Registration system with form validation.
   - Created a dynamic dashboard displaying real-time statistics: Total Tasks, Completed Tasks, Pomodoros Today, and Notes Saved.
   - Added a Profile page with a secure logout feature.

2. **Client-Side Database (Anfal):**
   - Implemented `window.localStorage` to act as the database, ensuring user-specific data is saved securely.
   - Isolated data by user email, ensuring privacy and persistence even after page refreshes.

3. **Advanced Pomodoro Timer (Anfal):**
   - Designed a premium 25-minute focus timer with 5-minute short breaks and 15-minute long breaks.
   - Added dynamic color changes (Purple for focus, Green/Blue for breaks).
   - Implemented state persistence (keeps running on refresh), sound alerts, and Spacebar shortcut for Start/Pause.

4. **Notes Manager (Eman Ansar):**
   - Created a feature to add, view, and delete study notes organized by subject.

### Team Contributions
5. **Daily Study Checklist (Mahnoor Ahmer / Team):**
   - Add new study tasks, set priority, mark tasks as complete, and delete tasks.
   - Track the number of completed tasks.

6. **Daily Motivational Quote (Mahnoor Ahmer / Team):**
   - Displays a random motivational quote that users can change.

7. **Subject-wise Progress Tracker (Team):**
   - Add subjects, set study goals, and view progress through progress bars.

## Technologies Used

- HTML
- CSS
- JavaScript
- LocalStorage (Client-side Database)
- Visual Studio Code
- GitHub

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/63852-EmanAnsar/major-assignment.git
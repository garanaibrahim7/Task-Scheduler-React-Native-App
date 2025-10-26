## Overview

The Task Scheduler App is a personal mobile application designed to manage daily tasks efficiently. 
Users can add tasks with specific titles, scheduled times, categories, priorities, and repeat options, along with a reminder delay to notify if tasks remain incomplete. Built with React Native and integrated with Supabase as the backend, the app now includes an authentication system to ensure user-specific task management. This update addresses the previous limitation where tasks were visible to all users.

## Features
- **Add Tasks**: Create tasks with a title, scheduled time, repeat option (Once, Daily, Weekly, Monthly), category (Personal, Work, Health, Shopping, Other), and priority (Low, Medium, High).
- **Reminder System**: Set a reminder delay (in minutes) to receive notifications if tasks are not completed on time.
- **Task History**: View completed tasks with timestamps and status (On Time, Late).
- **Statistics**: Track task completion rates, total tasks, overdue tasks, and streaks with a weekly overview.
- **Task Breakdown**: Analyze tasks by category and priority for better organization.
- **Insights**: Receive personalized tips and performance feedback based on task completion.
- **Authentication**: Secure login to ensure tasks are private to individual users.


## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```bash
   cd task-scheduler-app
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up Supabase:
   - Create a Supabase project and obtain the API keys.
   - Configure the `.env` file with your Supabase URL, anon key, and authentication settings.
5. Run the app:
   ```bash
   npx react-native run-android  # For Android
   npx react-native run-ios      # For iOS
   ```

## Usage
- Open the app and log in with your credentials on the authentication screen.
- Navigate to the "Add Task" screen to create a new task.
- Fill in the task details and click "Create Task" to save.
- View and manage tasks in the "My Tasks" screen.
- Check your progress and history in the "Statistics" and "History" screens.
- Receive reminders based on the set delay if tasks are not completed.

## Development
- **Frontend**: Built with React Native for a cross-platform mobile experience.
- **Backend**: Powered by Supabase for real-time database management and authentication.
- **Contributors**:
  - Concept by Ibrahim Garana.
  - Developed with the help of Vishal Chaudhary (React Native Developer).
  - Designed and developed with Bolt AI Agent, integrated with Supabase.

## Contributing
Contributions are welcome! Please fork the repository and submit pull requests with your changes. Ensure to follow the existing code style and include tests where applicable.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

## Contact
For any questions or suggestions, feel free to reach out to Ibrahim Garana or Vishal Chaudhary.

---

# GitHub User Search App

A simple web application that allows users to search for GitHub profiles and view basic user information.

## Features

- Search GitHub users by username
- Display user avatar and basic information
- Show user statistics (followers, following, repositories)
- Display user location, website, and Twitter handle (if available)
- Responsive design that works on all devices
- Loading states and error handling
- Direct link to GitHub profile

## Technologies Used

- HTML5
- CSS3 (with CSS Variables and Flexbox)
- Vanilla JavaScript (ES6+)
- GitHub REST API
- Font Awesome icons

## How to Use

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Enter a GitHub username in the search box
4. Click the search button or press Enter
5. View the user's profile information

## API Usage

This application uses the public GitHub API. No authentication is required for basic user information.

Rate Limits:
- 60 requests per hour for unauthenticated requests
- 5,000 requests per hour for authenticated requests

## Future Improvements

- Add dark/light theme toggle
- Display user's recent repositories
- Show user's contribution graph
- Add pagination for repositories
- Implement user search suggestions
- Add copy profile URL button - done
- Show user's top languages
- Add animations for better UX

# Overview
This is a realtime game where you move your spaceship around the board, dodging the asteroids that look like tater tots. Capture hearts in order to gain more lives. Survive until the time runs out and you win!

# Integration
Add this as a new game to the main menu, labeled "Spaceship Game" and using route "spaceship-game".


# Screenshot Prototype of Game in Paused Mode
![[game-screenshot-example.png]]
  
# Controls
## Before play
* Before play use arrow keys to navigate around the edge of the board
* When getting to the top or bottom of a side automatically switch sides
* Arrow keys perpendicular to the current side switch to the opposite side
## During play
* Arrow keys direct the spaceship (Only when running, not when paused)
# What happens when each thing crashes into each other thing
* When two asteroids crash into each other, a cloud appears for about 1 second.
* ![[cloud.png|107]]
* The asteroids are replaced with one heart each, which continue in the same trajectory as the asteroids had. But there can only be a max of 4 hearts on the board at one time; new hearts don't appear if the count would be more than 4.
* When Hearts intersect they Float through each other (no collision)
* ![[heart.png|132]]
* when a heart hits your spaceship you gain a life, and the Heart pops like a bubble
* When an asteroid hits your spaceship You lose a life and The asteroid explodes
# How things move
* Hearts float like bubbles, slowly 
* your spaceship goes medium speed
* asteroids move more quickly than the spaceship
* When you enter a portal on the any side (top, bottom, left, right), your ship teleports to the other side of the screen and 2 minutes are added to the time limit.
* When asteroids go through a portal, they disappear, as do hearts.
* Every 4 seconds, a new asteroid will come onto the board from a random portal on a random side of the board, but a maximum of 6 asteroids can be on the board at one time.
# What components look like
* Asteroids look like a tater with an arrow on it Indicating its direction
* ![[asteroid.png|89]]
* Spaceship is shaped like a big triangle, with a little triangle on the back, facing the opposite direction and two little sticks for legs that stick out from where the little triangle meets the big one. The big triangle points in the direction the ship is moving. See this zoomed-in scaled up drawing of spaceship pointing to the right:
* ![[spaceship-right.png|83]]
* Portals: there are 5 portals on each side of the board. They look like rectangles that line the edge of the board.
* The board looks like it is inset compared to the controls above the board and the rest of the screen. The portals on the sides act like 3D sides of the box for the inset.
# Other things about the game
* Occasionally out of one of the holes on the side of the board, an asteroid will shoot out
* Pressing space bar will start or pause the game; it can also resume it
* To start you have three lives and 5 minutes. If you survive for the full time limit, you win!

# Stuff at the top
* A button to toggle the game states, as described below.
	* This button in the top-left is a duplicate of the button in the center when the game has not yet started or is paused.
	* During playing, there's no center button, only a top-left button to pause the game.
* In the middle of the top bar, there is a timer.
	* It starts at 5 minutes and when your rocket ship disappears through a portal and comes out the other side you gain 2 minutes on this clock. 
	* When the clock Runs Out, you win
* On the right there's a heart and inside of the heart there's a number
	* This is how many lives you have left
	* When this gets to 0 you lose
# Game States
## Transitions
Not Started (initial) --(Play)--> Playing
Playing --(Pause)--> Paused
Paused --(Resume)--> Playing
Playing --(Run out of lives)--> You Lost
Playing --(Time runs out)--> You Won
(You Won; You Lost) --(New Game)--> Not Started
## Details
* Paused: when the Game is paused it has a resume button
	* (In the center of the board there is a window that says “paused”)
* Not started: when the game is not started yet it has a play button
	* ("Play" button also shows in the center of board)
* Playing: when the game is currently in action it has pause button


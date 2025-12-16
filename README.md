# **Ellipse Constraint Experiment**

A React-based geometric experiment that tracks mouse movement and constrains a follower element within a specific, rotated elliptical boundary.

## **How It Works**

The core logic ensures that an element (the blue dot) follows the mouse cursor but strictly respects the boundaries of a rotated ellipse. Since standard ellipse equations apply to axis-aligned shapes, we use a coordinate transformation approach:

1. **Translation**: Convert screen coordinates to local coordinates relative to the ellipse center $(0,0)$.  
2. **Inverse Rotation**: "Un-rotate" the mouse position by $-20^\\circ$. This aligns the point with a standard, non-rotated coordinate system where the ellipse axis lies on $X$ and $Y$.  
3. Clamping: Apply the standard ellipse inequality:  
   $$
   \\frac{x^2}{a^2} \+ \\frac{y^2}{b^2} \\le 1
   $$

   If the result is $\> 1$ (outside), we normalize the vector and scale it to exactly $1$ (the boundary).  
4. **Forward Rotation**: Rotate the constrained point back by $+20^\\circ$ to match the visual orientation of the ellipse.  
5. **Rendering**: Apply the final offset to the DOM element.

## **Configuration**

The ellipse properties are defined as constants at the top of the component:

const ROTATION\_DEG \= 20; // Rotation of the ellipse in degrees  
const RADIUS\_X \= 300;    // Major axis radius (half-width)  
const RADIUS\_Y \= 150;    // Minor axis radius (half-height)

## **Visual Guides**

* **Dashed Outline**: Represents the calculated boundary.  
* **Blue Dot**: The constrained element.  
* **Dotted Line**: A visual tether connecting the actual mouse position to the constrained position, helping visualize the clamping vector.

## **Usage**

This is a single-file React component using Tailwind CSS for styling.

1. Ensure you have React and Tailwind CSS installed.  
2. Copy the code into a file (e.g., EllipseTracker.jsx).  
3. Import and render the component in your main App entry point.
# Tissue Viability Monitor

MODIFY AND FIX MY EXISTING AI TISSUE VIABILITY PROJECT

I already have a working project hosted in this GitHub repository:

I also have an existing deployed homepage:

https://ai-tissue-viability.vercel.app

I do NOT want you to rebuild the application from scratch.

Instead:

Inspect the entire existing GitHub repository.

Understand the current architecture, frontend, backend, database, ML model integration, routes, and components.

Identify existing bugs, broken functionality, incorrect logic, UI problems, deployment issues, and integration problems.

Fix the existing problems without unnecessarily rewriting working code.

Preserve the existing homepage design and visual identity.

Add the required tissue viability animations and monitoring features.

Make the final application fully functional.

PROJECT

AI-Based Tissue Viability Prediction System for Post-Microsurgical Monitoring

The system predicts tissue viability using structured clinical and physiological patient data.

IMPORTANT:

The project does NOT use medical images.

Do NOT add medical-image processing, MRI, CT, X-ray, hyperspectral-image analysis, or image classification as part of the ML pipeline.

FIRST TASK — AUDIT THE EXISTING CODE

Before making changes, inspect:

app.py

prediction.py

database models

templates

CSS

JavaScript

model files

dataset integration

authentication

Flask routes

API endpoints

deployment configuration

requirements.txt

Vercel configuration

static assets

Identify:

Backend problems

incorrect routes

incorrect imports

database connection problems

prediction errors

incorrect feature names

model loading problems

session/authentication problems

ML problems

incorrect features

target leakage

incorrect preprocessing

wrong model input

probability calculation errors

incorrect prediction comparison

Frontend problems

broken buttons

broken links

incorrect API calls

layout problems

responsive design issues

missing animations

broken images/videos

console errors

Deployment problems

Check:

Vercel configuration

Flask deployment

static files

model file paths

environment variables

database paths

frontend/backend communication

Fix all genuine issues you find.

Do not invent problems.

DATASET

The project uses the actual patient dataset.

It contains:

Patient_ID
Age
Gender
BMI
Diabetes
Smoking
Hypertension
Heart_Rate
Blood_Pressure_Sys
SpO2
Tissue_Temperature
Blood_Flow
Perfusion_Index
Capillary_Refill_Time
Surgery_Duration
Flap_Type
Risk_Level
Tissue_Viability


The dataset contains 10,000 patient records.

CRITICAL ML RULE

Risk_Level is a target-leakage feature.

Therefore:

NEVER use Risk_Level as an ML input feature.

The Random Forest model must use exactly these 15 features:

Age
Gender
BMI
Diabetes
Smoking
Hypertension
Heart_Rate
Blood_Pressure_Sys
SpO2
Tissue_Temperature
Blood_Flow
Perfusion_Index
Capillary_Refill_Time
Surgery_Duration
Flap_Type


Risk_Level can remain in the database/display if required, but it must never be passed into the trained model.

EXISTING ML MODEL

Use the existing trained model if it is already present in the repository:

model/tissue_viability_model.pkl


Load it using Joblib.

Do NOT retrain the model every time the application starts or whenever a doctor searches for a patient.

The model is a:

Random Forest Classifier

Configuration used during training:

RandomForestClassifier(
    n_estimators=200,
    class_weight="balanced",
    random_state=42,
    n_jobs=-1
)


Categorical features:

Gender
Diabetes
Smoking
Hypertension
Blood_Flow
Flap_Type


Use:

OneHotEncoder(handle_unknown="ignore")


where appropriate.

PREDICTION OUTPUT

When a doctor searches for a patient, the application should:

Patient ID
       ↓
Retrieve patient
       ↓
Extract 15 ML features
       ↓
Random Forest
       ↓
Prediction
       ↓
Probability
       ↓
Confidence
       ↓
Compare with recorded viability


Return:

prediction
probability
confidence
recorded_viability
comparison


Confidence:

>= 80% → High
>= 60% → Moderate
< 60% → Low


Comparison:

AI prediction == recorded Tissue_Viability
→ Match

otherwise
→ Mismatch


HOMEPAGE

Use:

https://ai-tissue-viability.vercel.app

as the visual reference for the homepage.

Do NOT unnecessarily redesign it.

Preserve its:

theme

colors

typography

layout

navigation

visual hierarchy

cards

overall medical AI appearance

Improve only where necessary.

TISSUE ANIMATION

Add a realistic educational 3D tissue viability animation.

It should show the difference between:

VIABLE TISSUE

Show:

healthy tissue

healthy blood vessels

red blood cells flowing

strong circulation

good oxygenation

healthy red/pink appearance

subtle pulse

Label:

VIABLE

REDUCED PERFUSION

Gradually transition:

reduced blood flow

slower red blood cells

reduced oxygenation

weaker pulse

tissue becoming pale/dull

Label:

REDUCED PERFUSION

NON-VIABLE TISSUE

Show:

severely reduced blood flow

sparse/absent red blood cells

poor oxygenation

pale/dull tissue

weak/absent pulse

Label:

NON-VIABLE

ANIMATION LOCATION 1 — HOMEPAGE

Place the tissue animation prominently in the homepage hero/visualization section.

It should visually communicate:

Healthy circulation → Reduced perfusion → Non-viable tissue

The animation should automatically loop.

ANIMATION LOCATION 2 — DOCTOR DASHBOARD

Create or modify the existing card:

Tissue Perfusion Monitor

The exact layout must be:

┌───────────────────────────────────┐
│ Tissue Perfusion Monitor          │
│                                   │
│ [ ANIMATED TISSUE VISUALIZATION ] │
│                                   │
│ Blood Flow   Oxygenation          │
│                                   │
│ Perfusion                         │
└───────────────────────────────────┘


The animation MUST be:

directly below the heading

and

directly above the Blood Flow, Oxygenation, and Perfusion indicators.

Do not put it below the indicators.

Do not put it outside the card.

ANIMATION RESPONSE TO PATIENT DATA

Where practical, connect the visualization state to the patient's actual data.

For example:

Good blood flow

Show:

active RBC flow

healthy tissue

strong pulse

good oxygenation

Moderate blood flow

Show:

slower RBC flow

reduced oxygenation

weaker pulse

Low blood flow

Show:

sparse RBC flow

poor oxygenation

pale tissue

weak pulse

IMPORTANT:

This is a visual educational representation.

Do not claim that the animation itself performs diagnosis.

DOCTOR DASHBOARD

Doctor should be able to:

Login

Search patient

View patient information

Run AI prediction

View probability

View confidence

View recorded viability

View Match/Mismatch

View tissue perfusion animation

View physiological monitoring indicators

PATIENT INFORMATION

Display actual database values:

Patient ID

Age

Gender

BMI

Diabetes

Smoking

Hypertension

Flap Type

Heart Rate

Blood Pressure

SpO₂

Tissue Temperature

Blood Flow

Perfusion Index

Capillary Refill Time

Surgery Duration

Do NOT create fake patient records.

LOGIN

Maintain/fix the existing authentication system.

Routes:

/
 /login
 /logout
 /doctor
 /patient


Doctor:

GET /doctor
POST /doctor


Patient:

GET /patient


Doctor should have patient-search functionality.

Patient should only see their own information.

MODEL PERFORMANCE

If the existing project already contains the validation results, preserve them.

Current model validation results:

Accuracy: 99.90%
ROC-AUC: 1.0000
Validation records: 10,000
Correct predictions: 9,990 / 10,000


Confusion matrix:

[[1208, 0],
 [10, 8782]]


Display these only as:

Validation results on the current dataset

Do NOT call them clinical validation results.

FEATURE IMPORTANCE

If:

model/feature_importance.csv


exists, use the actual values.

Do not invent feature importance numbers.

Important features include:

Blood Flow

SpO₂

Capillary Refill Time

Perfusion Index

Surgery Duration

Diabetes

Smoking

Tissue Temperature

RESPONSIVE DESIGN

Ensure the existing application works correctly on:

Desktop

Tablet

Mobile

Tissue visualization approximately:

Desktop: 182px
Tablet: 160px
Mobile: 140px
Small mobile: 120px


Use:

width: 100%;
height: 100%;
object-fit: cover;


with rounded corners.

CODE QUALITY

Do not unnecessarily replace working code.

Follow this process:

Step 1

Audit existing repository.

Step 2

List the problems found.

Step 3

Fix backend/ML problems.

Step 4

Fix frontend problems.

Step 5

Add tissue visualization.

Step 6

Connect frontend and backend.

Step 7

Test patient search.

Step 8

Test prediction.

Step 9

Test responsive layout.

Step 10

Test deployment.

IMPORTANT — DO NOT BREAK WORKING FEATURES

Before changing any file:

understand its purpose

preserve working functionality

modify only what is necessary

avoid unnecessary rewrites

keep existing database structure where possible

keep existing trained model

keep existing homepage design

If something is already working correctly, leave it unchanged.

FINAL ACCEPTANCE TEST

The final application must successfully demonstrate:

Homepage
   ↓
Login
   ↓
Doctor Dashboard
   ↓
Patient Search
   ↓
Real Patient Data
   ↓
Random Forest Prediction
   ↓
Probability
   ↓
Confidence
   ↓
Recorded Viability
   ↓
Match/Mismatch
   ↓
Tissue Perfusion Animation
   ↓
Blood Flow / Oxygenation / Perfusion


Test using real patient IDs from the dataset.

Do not use dummy data for the final demonstration.

FINAL DISCLAIMER

Add:

Clinical Decision-Support Prototype: This application is intended for educational and research purposes only. It does not replace professional medical judgment, diagnosis, or clinical assessment.

FINAL INSTRUCTION

Do not start from zero.

Inspect my GitHub repository first, understand what I already built, identify the mistakes, fix them, preserve the working parts, and then add the requested tissue viability animations and functionality.

At the end, provide:

A summary of the problems you found.

The files you changed.

What you fixed.

What you added.

How to run the application.

Any remaining issues that require manual action.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d3669532-87f3-4511-b830-029e8636ae3f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

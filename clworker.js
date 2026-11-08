export default {
    async fetch(request, env, ctx) {
        if (request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        const corsHeaders = {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization"
        };

        if (request.method === "GET" && (path === "/" || path === "/health")) {
            return new Response(JSON.stringify({
                status: "active",
                service: "GradeLift AI Worker",
                model: "@cf/meta/llama-3.1-8b-instruct",
                endpoints: ["/generate-quiz", "/analyze-answer"]
            }), { headers: corsHeaders });
        }

        if (request.method === "POST" && path.endsWith("/generate-quiz")) {
            try {
                const body = await request.json();
                const noteTitle = body.title || "Study Topic";
                const noteContent = body.content || "";
                const quizType = body.type || "mcq";
                const count = Math.min(Math.max(parseInt(body.count, 10) || 5, 1), 10);
                const difficulty = body.difficulty || "medium";

                if (!noteContent && !noteTitle) {
                    return new Response(JSON.stringify({ error: "Note content or title is required." }), {
                        status: 400,
                        headers: corsHeaders
                    });
                }

                if (env && env.AI) {
                    const systemPrompt = `You are an expert academic tutor for GradeLift. Generate an educational quiz based strictly on the provided student notes.
Quiz Type: ${quizType}
Difficulty: ${difficulty}
Number of questions: ${count}

Return ONLY valid JSON matching this exact structure without markdown backticks or commentary:
{
  "title": "${noteTitle.replace(/"/g, '\\"')}",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question text here?",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A",
      "explanation": "Why this answer is correct."
    },
    {
      "id": 2,
      "type": "short_answer",
      "question": "Open-ended question text here?",
      "modelAnswer": "Model answer covering the core concepts.",
      "keyPoints": ["Point 1", "Point 2"],
      "explanation": "Explanation of the answer."
    }
  ]
}

If quizType is "mcq", all questions must have type "mcq".
If quizType is "short_answer", all questions must have type "short_answer".
If quizType is "mixed", alternate between "mcq" and "short_answer".`;

                    const userPrompt = `Notes Title: ${noteTitle}\n\nNotes Content:\n${noteContent.slice(0, 4000)}`;

                    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        max_tokens: 2048,
                        temperature: 0.3
                    });

                    let rawText = "";
                    if (aiResponse && aiResponse.response) {
                        rawText = aiResponse.response;
                    } else if (typeof aiResponse === "string") {
                        rawText = aiResponse;
                    } else {
                        rawText = JSON.stringify(aiResponse);
                    }

                    rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

                    const parsed = JSON.parse(rawText);
                    return new Response(JSON.stringify({
                        success: true,
                        source: "gradelift-ai",
                        ...parsed
                    }), { headers: corsHeaders });
                }

                const fallbackQuestions = generateFallbackQuiz(noteTitle, noteContent, quizType, count);
                return new Response(JSON.stringify({
                    success: true,
                    source: "worker-engine",
                    title: noteTitle,
                    questions: fallbackQuestions
                }), { headers: corsHeaders });

            } catch (err) {
                return new Response(JSON.stringify({
                    error: err.message || "Failed to generate quiz."
                }), { status: 500, headers: corsHeaders });
            }
        }

        if (request.method === "POST" && path.endsWith("/analyze-answer")) {
            try {
                const body = await request.json();
                const question = body.question || "";
                const modelAnswer = body.modelAnswer || "";
                const keyPoints = Array.isArray(body.keyPoints) ? body.keyPoints : [];
                const userAnswer = (body.userAnswer || "").trim();

                if (!userAnswer) {
                    return new Response(JSON.stringify({
                        score: 0,
                        rating: "Needs Improvement",
                        isUpToMark: false,
                        feedback: "No answer was provided. Please write your thoughts to receive feedback.",
                        strengths: [],
                        missingConcepts: ["Complete response required."]
                    }), { headers: corsHeaders });
                }

                if (env && env.AI) {
                    const evalPrompt = `You are an academic examiner for GradeLift. Evaluate the student's answer to the following question.
Question: "${question.replace(/"/g, '\\"')}"
Model Answer: "${modelAnswer.replace(/"/g, '\\"')}"
Key Concepts: ${JSON.stringify(keyPoints)}

Student's Answer: "${userAnswer.replace(/"/g, '\\"')}"

Evaluate whether the answer is accurate, complete, and up to mark.
Return ONLY valid JSON matching this exact structure without markdown backticks:
{
  "score": 85,
  "rating": "Good / Up to Mark",
  "isUpToMark": true,
  "feedback": "Detailed feedback summarizing the quality of the answer.",
  "strengths": ["Clear definition", "Correct terminology"],
  "missingConcepts": ["Could include specific examples"],
  "improvedAnswer": "How to refine the answer for full marks."
}
Score must be an integer between 0 and 100.
rating must be one of: "Excellent", "Good / Up to Mark", "Partially Correct", "Needs Improvement".
isUpToMark must be true if score >= 70, otherwise false.`;

                    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
                        messages: [
                            { role: "system", content: evalPrompt },
                            { role: "user", content: "Please evaluate the student answer now." }
                        ],
                        max_tokens: 1024,
                        temperature: 0.2
                    });

                    let rawText = "";
                    if (aiResponse && aiResponse.response) {
                        rawText = aiResponse.response;
                    } else if (typeof aiResponse === "string") {
                        rawText = aiResponse;
                    } else {
                        rawText = JSON.stringify(aiResponse);
                    }

                    rawText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

                    const parsed = JSON.parse(rawText);
                    return new Response(JSON.stringify({
                        success: true,
                        source: "gradelift-ai",
                        ...parsed
                    }), { headers: corsHeaders });
                }

                const fallbackAnalysis = analyzeFallbackAnswer(question, modelAnswer, keyPoints, userAnswer);
                return new Response(JSON.stringify({
                    success: true,
                    source: "worker-engine",
                    ...fallbackAnalysis
                }), { headers: corsHeaders });

            } catch (err) {
                return new Response(JSON.stringify({
                    error: err.message || "Failed to analyze answer."
                }), { status: 500, headers: corsHeaders });
            }
        }

        return new Response(JSON.stringify({ error: "Endpoint not found." }), {
            status: 404,
            headers: corsHeaders
        });
    }
};

function generateFallbackQuiz(title, content, type, count) {
    const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 10);
    const questions = [];

    for (let i = 0; i < count; i++) {
        const line = lines[i % (lines.length || 1)] || `${title} key concepts and applications.`;
        const qType = type === "mixed" ? (i % 2 === 0 ? "mcq" : "short_answer") : type;

        if (qType === "mcq") {
            questions.push({
                id: i + 1,
                type: "mcq",
                question: `Regarding ${title}, which statement best reflects: "${line.slice(0, 80)}"?`,
                options: [
                    `A) It accurately represents a fundamental principle of ${title}`,
                    `B) It is only applicable in theoretical models`,
                    `C) It contradicts standard established axioms`,
                    `D) It has been superseded by modern research`
                ],
                correctAnswer: "A",
                explanation: `Option A is correct based on the study notes on ${title}.`
            });
        } else {
            questions.push({
                id: i + 1,
                type: "short_answer",
                question: `Explain the significance of "${line.slice(0, 90)}" in the context of ${title}.`,
                modelAnswer: `In ${title}, this concept establishes the core principles for understanding related problems and applications.`,
                keyPoints: [title, "Fundamental principle", "Practical application"],
                explanation: `A comprehensive answer covers definition, core mechanism, and real-world significance.`
            });
        }
    }

    return questions;
}

function analyzeFallbackAnswer(question, modelAnswer, keyPoints, userAnswer) {
    const text = userAnswer.toLowerCase();
    let matches = 0;
    const missing = [];
    const strengths = [];

    const words = (modelAnswer + " " + keyPoints.join(" ")).toLowerCase().split(/[\s,.-]+/).filter(w => w.length > 4);
    const uniqueKeywords = Array.from(new Set(words));

    uniqueKeywords.forEach(keyword => {
        if (text.includes(keyword)) {
            matches++;
        }
    });

    const ratio = uniqueKeywords.length > 0 ? (matches / Math.min(uniqueKeywords.length, 6)) : 0.6;
    let score = Math.round(Math.min(Math.max(ratio * 100, 30), 95));

    if (userAnswer.length > 120 && score < 75) {
        score += 15;
    }

    if (userAnswer.length < 25) {
        score = Math.min(score, 45);
        missing.push("Answer is too brief. Provide a more detailed explanation.");
    }

    let rating = "Good / Up to Mark";
    let isUpToMark = true;

    if (score >= 85) {
        rating = "Excellent";
        strengths.push("Thorough understanding of key concepts demonstrated.");
        strengths.push("Clear and precise vocabulary used.");
    } else if (score >= 70) {
        rating = "Good / Up to Mark";
        strengths.push("Addresses the core question directly.");
        missing.push("Could elaborate more on contextual nuance or specific examples.");
    } else if (score >= 50) {
        rating = "Partially Correct";
        isUpToMark = false;
        missing.push("Partially captures the main idea but misses critical elements.");
    } else {
        rating = "Needs Improvement";
        isUpToMark = false;
        missing.push("Response lacks sufficient depth and key terminology.");
    }

    return {
        score,
        rating,
        isUpToMark,
        feedback: isUpToMark
            ? "Your answer is well-structured and aligns closely with the expected concepts from your study notes."
            : "Your answer touches upon the topic but needs more depth, precise terminology, and supporting details to be considered up to mark.",
        strengths,
        missingConcepts: missing.length ? missing : ["None noted - strong performance!"],
        improvedAnswer: modelAnswer || "A complete answer clearly defines the concept and highlights its main significance."
    };
}

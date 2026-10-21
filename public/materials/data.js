// Learning materials, in study order. A topic with the same name in two subjects is a repeat:
// it is studied in the first subject that has it, and shown gray in the later ones.
// Edit freely: add topics, rename them, or move them between subjects.
export const SUBJECTS = [
  {
    slug: "mathematics",
    title: "Mathematics",
    icon: "sigma",
    intro: "The language under statistics and machine learning: how to describe change, space, and uncertainty.",
    groups: [
      { name: "Foundations", topics: ["Sets and logic", "Functions", "Proofs", "Combinatorics"] },
      { name: "Linear algebra", topics: ["Vectors", "Matrices", "Linear transformations", "Eigenvalues and eigenvectors", "Singular value decomposition"] },
      { name: "Calculus", topics: ["Limits", "Derivatives", "Integrals", "Partial derivatives", "Chain rule"] },
      { name: "Probability", topics: ["Probability", "Random variables", "Probability distributions", "Expected value and variance", "Bayes' theorem"] },
      { name: "Optimization", topics: ["Convex functions", "Gradient descent", "Lagrange multipliers"] },
    ],
  },
  {
    slug: "statistics",
    title: "Statistics",
    icon: "chart-column",
    intro: "Learning from data: summarizing it, measuring uncertainty, and testing ideas against it.",
    groups: [
      { name: "Describing data", topics: ["Descriptive statistics", "Data visualization", "Probability distributions", "Expected value and variance"] },
      { name: "Inference", topics: ["Sampling", "Central limit theorem", "Confidence intervals", "Hypothesis testing", "p-values"] },
      { name: "Models", topics: ["Correlation", "Linear regression", "Logistic regression", "Analysis of variance (ANOVA)"] },
      { name: "Bayesian statistics", topics: ["Bayes' theorem", "Prior and posterior", "Markov chain Monte Carlo"] },
      { name: "Experiments", topics: ["Experiment design", "A/B testing"] },
    ],
  },
  {
    slug: "artificial-intelligence",
    title: "Artificial Intelligence",
    icon: "bot",
    intro: "Systems that learn from data and act on it, from classic machine learning to large language models.",
    groups: [
      { name: "Machine learning basics", topics: ["Supervised learning", "Unsupervised learning", "Linear regression", "Logistic regression", "Overfitting and regularization", "Cross-validation"] },
      { name: "Classic models", topics: ["Decision trees", "Random forests", "Gradient boosting", "k-means clustering", "Principal component analysis"] },
      { name: "Deep learning", topics: ["Neural networks", "Backpropagation", "Gradient descent", "Chain rule", "Convolutional neural networks", "Recurrent neural networks"] },
      { name: "Language models", topics: ["Embeddings", "Transformers", "Attention", "Large language models", "Prompting", "Retrieval-augmented generation"] },
      { name: "Practice", topics: ["Feature engineering", "Model evaluation", "AI safety and ethics"] },
    ],
  },
  {
    slug: "data",
    title: "Data",
    icon: "database",
    intro: "Getting data, storing it, cleaning it, and turning it into answers people can use.",
    groups: [
      { name: "Storing data", topics: ["Relational databases", "SQL", "Data modeling", "NoSQL databases", "Data warehouses"] },
      { name: "Moving data", topics: ["ETL and ELT", "Data pipelines", "Streaming data", "APIs"] },
      { name: "Preparing data", topics: ["Data cleaning", "Feature engineering", "Sampling", "Data quality"] },
      { name: "Analysis", topics: ["Descriptive statistics", "Data visualization", "Dashboards", "A/B testing", "Linear regression"] },
      { name: "Working with data", topics: ["Data governance", "Privacy and security"] },
    ],
  },
];

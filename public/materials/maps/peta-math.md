# Math

Inti: The math an informatics degree rests on, from logic and discrete structures to linear algebra, calculus, optimization, and numerical methods, plus a gentle bridge toward graduate (S2) math.

<!--
Format (rules: Aturan Peta Math, Stats, Data, dan AI, v1.1)
- <ID> <Label, at most 4 words> | <one-sentence core> | butuh: <ID>; <ID>     (needs a topic in another map)
- <ID> <Label> | rujukan: <owner ID>                                           (a copy of a topic owned elsewhere)
Fields under a node, indented one level and starting with ">":
  > nama: full name, abbreviations spelled out      (when the label is shortened)
  > alasan <ID>: why the "butuh" link exists
  > lihat juga: <ID>; <ID>                          (related nodes in this map)
  > peta sistem: <Map>: <Area> #<system number>     (separate several with ";")
  > bintang: why this matters for software engineers and architects
  > tingkat: transisi                                (a bridge from S1 toward S2; children of a bridge branch inherit it)
Probability, statistics, and queueing theory belong to the Stats map; they are not written here.
-->

- M1 Foundations | The language of every other branch: logic, proof, sets, relations, and functions.
  - M1.1 Propositional Logic | Statements joined by and, or, not, and implies, and how to tell whether they are true.
    > bintang: Every if, feature flag, and access rule is a proposition; simplifying them removes whole classes of bugs.
    > lihat juga: M2.4
    - M1.1.1 Truth Tables | List every combination of truth values to find a statement's result.
    - M1.1.2 Logical Equivalence | Two statements that are true in exactly the same cases, like De Morgan's laws.
    - M1.1.3 Normal Forms | Rewrite any statement as an AND of ORs or an OR of ANDs.
      > nama: Conjunctive and Disjunctive Normal Forms (CNF and DNF)
  - M1.2 Predicate Logic | Statements about objects using "for all" and "there exists".
    > bintang: Specifications, SQL WHERE clauses, and invariants are predicates; reading them precisely is part of design.
    - M1.2.1 Quantifiers | "For all" and "there exists", and how negation flips between them.
    - M1.2.2 Nested Quantifiers | Statements with several quantifiers, where the order changes the meaning.
  - M1.3 Proof Techniques | Standard ways to show a statement is always true.
    - M1.3.1 Direct Proof | Start from the assumptions and reach the conclusion step by step.
    - M1.3.2 Proof by Contradiction | Assume the statement is false and derive something impossible.
    - M1.3.3 Proof by Contrapositive | Prove "if not B then not A" to show "if A then B".
    - M1.3.4 Proof by Cases | Split a claim into cases that together cover everything.
  - M1.4 Mathematical Induction | Prove a statement for every natural number from a base case and a step.
    > bintang: The same reasoning proves recursive functions and loop invariants correct.
    - M1.4.1 Strong Induction | The step may use every earlier case, not just the previous one.
    - M1.4.2 Structural Induction | Induction over trees, lists, and other recursively built structures.
  - M1.5 Sets | Collections of distinct objects and the operations between them.
    > bintang: Data modeling, SQL set operations, and permission checks are set algebra.
    - M1.5.1 Set Operations | Union, intersection, difference, and complement.
    - M1.5.2 Power Sets | The set of every subset of a set.
    - M1.5.3 Cartesian Product | Every ordered pair taken from two sets.
    - M1.5.4 Cardinality | Compare the sizes of sets, including countable and uncountable infinities.
      > tingkat: transisi
  - M1.6 Relations | Pairings between elements of sets and the properties they can have.
    > bintang: Relational databases, foreign keys, and dependency ordering are relations.
    - M1.6.1 Equivalence Relations | Reflexive, symmetric, transitive relations that split a set into classes.
    - M1.6.2 Partial Orders | Reflexive, antisymmetric, transitive relations that order some pairs.
      > lihat juga: M2.3.4
  - M1.7 Functions | Rules that give exactly one output for each input.
    > bintang: Pure functions and idempotent API calls are functions in this exact sense.
    - M1.7.1 Injective and Surjective | One-to-one and onto functions, and bijections that are both.
    - M1.7.2 Function Composition | Apply one function to the result of another.
    - M1.7.3 Inverse Functions | A function that undoes another, which exists only for bijections.

- M2 Discrete Mathematics | Countable structures that programs are built from: counting, recurrences, graphs, logic circuits, and automata.
  - M2.1 Counting | Count arrangements and selections without listing them.
    > bintang: Sizing ID spaces, test combinations, and capacity estimates is counting.
    - M2.1.1 Permutations | Ordered arrangements of items.
    - M2.1.2 Combinations | Unordered selections of items.
    - M2.1.3 Pigeonhole Principle | More items than boxes means some box holds two or more.
      > bintang: Explains why hash collisions are unavoidable and how big an ID space must be.
    - M2.1.4 Inclusion–Exclusion | Count a union by adding sets and subtracting their overlaps.
  - M2.2 Recurrence Relations | Sequences defined by earlier terms, and their closed forms.
    > bintang: The cost of a recursive algorithm is a recurrence; solving it gives its running time.
    - M2.2.1 Linear Recurrences | Solve recurrences like Fibonacci with characteristic equations.
    - M2.2.2 Master Theorem | Read off the running time of divide-and-conquer recurrences.
      > lihat juga: M2.6
  - M2.3 Graph Theory | Vertices joined by edges, and the paths, trees, and flows through them.
    > bintang: Service dependencies, networks, routing, and build pipelines are graphs; architects reason about them daily.
    > peta sistem: Logistics: Road and Rail #2; Game Story: Narrative and Progress #1
    - M2.3.1 Graph Representations | Adjacency lists and matrices, and when each fits.
    - M2.3.2 Trees | Connected graphs without cycles, including rooted and spanning trees.
    - M2.3.3 Shortest Paths | The cheapest route between vertices in a weighted graph.
    - M2.3.4 Topological Ordering | A line-up of a directed acyclic graph where every edge points forward.
      > bintang: Build systems, database migrations, and job schedulers run in topological order.
      > lihat juga: M1.6.2
    - M2.3.5 Network Flow | The most that can move from a source to a sink through limited edges.
  - M2.4 Boolean Algebra | Algebra on true and false, the math of logic circuits.
    > bintang: Simplifying conditions and working with bit flags and masks.
    > lihat juga: M1.1
    - M2.4.1 Logic Gates | AND, OR, NOT, and XOR as building blocks of circuits.
    - M2.4.2 Karnaugh Maps | A grid for simplifying Boolean expressions by hand.
  - M2.5 Automata and Languages | Abstract machines and the sets of strings they accept.
    > bintang: Regular expressions, parsers, and workflow state machines come straight from here.
    > peta sistem: Game Story: Enemies, Allies, Director #8
    - M2.5.1 Finite Automata | Machines with a fixed set of states that read input one symbol at a time.
    - M2.5.2 Regular Expressions | Patterns that describe exactly the languages finite automata accept.
    - M2.5.3 Context-Free Grammars | Rules that generate nested languages like code and JSON.
    - M2.5.4 Turing Machines | The simplest model of a computer that can run any algorithm.
    - M2.5.5 Decidability | Which problems no program can ever solve, like the halting problem.
      > tingkat: transisi
  - M2.6 Asymptotic Notation | Describe how fast a function grows as its input gets large.
    > bintang: Big O is how engineers and architects compare designs before they hit scale.
    - M2.6.1 Big O Notation | An upper bound on growth, ignoring constants.
    - M2.6.2 Big Theta and Omega | Tight and lower bounds on growth.
    - M2.6.3 Complexity Classes | P, NP, and NP-complete: which problems have fast solutions.
      > bintang: Knowing a problem is NP-hard tells you to reach for approximations and heuristics instead of an exact answer.
  - M2.7 Generating Functions | Encode a sequence as the coefficients of a power series.
    > tingkat: transisi
    - M2.7.1 Ordinary Generating Functions | Power series that turn counting problems into algebra.
    - M2.7.2 Exponential Generating Functions | Series for counting labeled arrangements.

- M3 Number Theory and Algebra | Integers, the number systems computers use, and the algebra behind cryptography.
  - M3.1 Divisibility and Primes | How integers divide each other and the primes they are built from.
    - M3.1.1 Greatest Common Divisor | The largest number dividing two integers, found with Euclid's algorithm.
    - M3.1.2 Prime Factorization | Every integer above 1 is a unique product of primes.
  - M3.2 Modular Arithmetic | Arithmetic that wraps around at a fixed number, like a clock.
    > bintang: Hashing, sharding by key, ring buffers, and checksums all use the remainder.
    - M3.2.1 Congruences | Two numbers with the same remainder after dividing by n.
    - M3.2.2 Modular Inverse | The number that multiplies to 1 modulo n, when it exists.
    - M3.2.3 Fast Exponentiation | Compute large powers modulo n in a logarithmic number of steps.
  - M3.3 Number Systems | How numbers are written in different bases and stored in hardware.
    > bintang: Overflow, bit shifts, and storing money as integers depend on knowing these.
    - M3.3.1 Binary and Hexadecimal | Base 2 and base 16, and converting between bases.
    - M3.3.2 Two's Complement | How computers store negative integers.
    - M3.3.3 Floating Point | Numbers stored as a sign, exponent, and fraction under IEEE 754.
      > lihat juga: M7.1
  - M3.4 Groups and Fields | Sets with operations that follow fixed rules.
    - M3.4.1 Groups | One operation with identity, inverses, and associativity.
    - M3.4.2 Rings and Fields | Two operations, where a field also allows division.
    - M3.4.3 Finite Fields | Fields with finitely many elements, used in error correction and cryptography.
  - M3.5 Cryptographic Foundations | The number theory that makes public-key cryptography work.
    > bintang: TLS, signatures, and key management rest on this; architects choose and combine them.
    > peta sistem: Finance: Banking #136; Energy: Smart Meters and IoT #46
    - M3.5.1 RSA | Encryption based on how hard it is to factor large numbers.
      > nama: Rivest–Shamir–Adleman (RSA)
    - M3.5.2 Diffie–Hellman | Two parties agree on a shared secret over an open channel.
    - M3.5.3 Elliptic Curves | Group arithmetic on curves that gives short, strong keys.
  - M3.6 Complex Numbers | Numbers with a real and an imaginary part, and their geometry.
    - M3.6.1 Complex Arithmetic | Add, multiply, and divide numbers of the form a + bi.
    - M3.6.2 Polar Form | Write a complex number as a length and an angle.
    - M3.6.3 Euler's Formula | e to the i theta equals cos theta plus i sin theta, linking exponentials and rotation.

- M4 Linear Algebra | Vectors, matrices, and the linear maps between spaces.
  - M4.1 Vectors | Quantities with size and direction, written as lists of numbers.
    > bintang: Embeddings and vector search store meaning as vectors; similarity is a dot product.
    - M4.1.1 Dot Product | Multiply matching entries and add, giving length and angle information.
    - M4.1.2 Norms | Ways to measure a vector's length.
  - M4.2 Matrices | Grids of numbers that represent data and linear maps.
    - M4.2.1 Matrix Multiplication | Combine two matrices so their maps apply one after the other.
    - M4.2.2 Determinants | A number that shows how a matrix scales area or volume.
    - M4.2.3 Inverse Matrices | The matrix that undoes another, when it exists.
  - M4.3 Systems of Equations | Several linear equations solved together.
    - M4.3.1 Gaussian Elimination | Row operations that bring a system to a solvable form.
    - M4.3.2 Rank | The number of independent rows or columns of a matrix.
  - M4.4 Vector Spaces | Sets of vectors closed under adding and scaling.
    - M4.4.1 Linear Independence | No vector in the set is a combination of the others.
    - M4.4.2 Basis and Dimension | A smallest spanning set, and how many vectors it holds.
    - M4.4.3 Orthogonality | Vectors at right angles, and orthonormal bases.
  - M4.5 Linear Transformations | Maps between vector spaces that keep adding and scaling.
    - M4.5.1 Rotation and Scaling | The matrices behind 2D and 3D graphics.
    - M4.5.2 Projections | Map a vector onto a line or plane.
  - M4.6 Eigenvalues and Eigenvectors | Directions a matrix only stretches, and by how much.
    > lihat juga: M4.7.3
    - M4.6.1 Characteristic Polynomial | The polynomial whose roots are a matrix's eigenvalues.
    - M4.6.2 Diagonalization | Rewrite a matrix in its eigenvector basis, where it only scales.
  - M4.7 Matrix Decompositions | Write a matrix as a product of simpler matrices.
    - M4.7.1 LU Decomposition | A lower and an upper triangular matrix, for solving systems fast.
    - M4.7.2 QR Decomposition | An orthogonal and an upper triangular matrix, for least squares.
    - M4.7.3 Singular Value Decomposition | Any matrix as rotation, scaling, and rotation.
      > nama: Singular Value Decomposition (SVD)

- M5 Calculus | Change and accumulation: limits, derivatives, integrals, series, and differential equations.
  - M5.1 Limits and Continuity | What a function approaches, and when it has no jumps.
    - M5.1.1 Limit Laws | Rules for limits of sums, products, and quotients.
    - M5.1.2 Continuity | Functions whose graph has no breaks, and what follows from that.
  - M5.2 Derivatives | The rate at which a function changes.
    - M5.2.1 Differentiation Rules | Power, product, and quotient rules.
    - M5.2.2 Chain Rule | The derivative of a function inside another function.
  - M5.3 Integrals | Accumulated area and the reverse of differentiation.
    - M5.3.1 Definite Integrals | The area under a curve between two points.
    - M5.3.2 Integration Techniques | Substitution, parts, and partial fractions.
    - M5.3.3 Improper Integrals | Integrals over infinite ranges or across a blow-up.
  - M5.4 Sequences and Series | Infinite lists of numbers and their sums.
    - M5.4.1 Convergence Tests | Ways to tell whether an infinite sum has a finite value.
    - M5.4.2 Taylor Series | Approximate a function with a polynomial around a point.
    - M5.4.3 Geometric Series | Sums where each term is a fixed multiple of the last.
      > bintang: Exponential backoff and the amortized cost of growing arrays are geometric series.
  - M5.5 Multivariable Calculus | Calculus for functions of several variables.
    - M5.5.1 Partial Derivatives | The rate of change along one variable at a time.
    - M5.5.2 Gradients | The vector of partial derivatives, pointing uphill.
      > lihat juga: M6.3.1
    - M5.5.3 Multiple Integrals | Integrate over areas and volumes.
  - M5.6 Differential Equations | Equations that relate a function to its own rates of change.
    - M5.6.1 First-Order Equations | Equations with only the first derivative, like growth and decay.
    - M5.6.2 Linear Systems | Several linear differential equations solved together.

- M6 Optimization | The theory of finding the best value under rules; how models are trained belongs to AI.
  - M6.1 Optimization Problems | An objective to minimize or maximize, with constraints.
  - M6.2 Convexity | Shapes and functions where every local minimum is the global one.
    - M6.2.1 Convex Sets | Sets that contain the whole segment between any two of their points.
    - M6.2.2 Convex Functions | Functions whose graph lies below every chord.
  - M6.3 Gradient Methods | Improve a guess step by step using derivatives.
    - M6.3.1 Gradient Descent | Step against the gradient to go downhill.
      > lihat juga: M5.5.2
    - M6.3.2 Newton's Method | Use second derivatives to take smarter steps.
      > lihat juga: M7.2.2
  - M6.4 Constrained Optimization | Find the best value while staying inside limits.
    - M6.4.1 Lagrange Multipliers | Turn equality constraints into extra variables.
    - M6.4.2 KKT Conditions | Optimality conditions when constraints are inequalities.
      > nama: Karush–Kuhn–Tucker (KKT) conditions
  - M6.5 Linear Programming | Optimize a linear objective under linear constraints.
    > bintang: Capacity planning, cost allocation, and scheduling are linear programs.
    > peta sistem: Energy: Transmission and System Operation #15; Energy: Transmission and System Operation #16; Logistics: Road and Rail #2
    - M6.5.1 Simplex Method | Walk along the corners of the feasible region to the best one.
    - M6.5.2 Duality | Every linear program has a twin whose answer bounds the original.
    - M6.5.3 Integer Programming | Linear programs whose answers must be whole numbers.
  - M6.6 Dynamic Programming | Solve a problem by combining the best answers to its smaller parts.
    > bintang: Caching, diffing, routing, and many interview-grade algorithms are dynamic programming.
    - M6.6.1 Bellman Principle | An optimal plan is made of optimal smaller plans.
    - M6.6.2 Overlapping Subproblems | The same smaller problem comes back, so its answer is worth keeping.

- M7 Numerical Methods | Computing with real numbers on finite machines, and keeping the error in check.
  - M7.1 Numerical Error | Rounding, cancellation, and how errors grow through a computation.
    > bintang: Money, timestamps, and comparisons break when floating point error is ignored.
    > lihat juga: M3.3.3
  - M7.2 Root Finding | Find where a function equals zero.
    - M7.2.1 Bisection Method | Halve an interval that contains the root until it is small enough.
    - M7.2.2 Newton–Raphson Method | Follow the tangent line toward the root.
      > lihat juga: M6.3.2
  - M7.3 Numerical Integration | Estimate an integral with sums of simple shapes.
    - M7.3.1 Trapezoid Rule | Approximate the area with trapezoids.
    - M7.3.2 Simpson's Rule | Approximate the area with parabolas for more accuracy.
  - M7.4 Interpolation | Build a function that passes through known points.
    - M7.4.1 Polynomial Interpolation | One polynomial through every point.
    - M7.4.2 Splines | Smooth pieces of polynomial joined together.
  - M7.5 Numerical Linear Algebra | Solve large linear systems accurately on a computer.
    - M7.5.1 Condition Number | How much a system's answer can swing when its input changes a little.
    - M7.5.2 Iterative Solvers | Improve a guess step by step instead of solving directly.
  - M7.6 Numerical ODE Solvers | Step a differential equation forward in time.
    > nama: Numerical Ordinary Differential Equation (ODE) Solvers
    > lihat juga: M5.6
    - M7.6.1 Euler Method | Take straight-line steps along the slope.
    - M7.6.2 Runge–Kutta Methods | Blend several slopes per step for much better accuracy.

- M8 Bridge to Graduate Math | A gentle step from S1 toward S2: rigor, structure, and abstraction, without full graduate depth.
  > tingkat: transisi
  - M8.1 Real Analysis | Calculus made rigorous, with exact definitions of limits and convergence.
    > lihat juga: M5.1
    - M8.1.1 Epsilon–Delta Proofs | Prove limits and continuity from the exact definition.
    - M8.1.2 Completeness of Reals | Every bounded set of reals has a least upper bound.
    - M8.1.3 Uniform Convergence | When a sequence of functions converges evenly everywhere.
    - M8.1.4 Riemann Integral | The precise definition of the integral as a limit of sums.
  - M8.2 Metric Spaces | Sets with a distance, where limits and continuity still make sense.
    - M8.2.1 Open and Closed Sets | Sets with or without their boundary.
    - M8.2.2 Complete Metric Spaces | Spaces where every Cauchy sequence has a limit.
    - M8.2.3 Compactness | Sets where every sequence has a convergent subsequence.
    - M8.2.4 Fixed Point Theorems | Conditions that guarantee an iteration settles on one point.
  - M8.3 Abstract Algebra | The structure theory behind groups, rings, and fields.
    > lihat juga: M3.4
    - M8.3.1 Homomorphisms | Maps between structures that keep their operations.
    - M8.3.2 Quotient Structures | Build a new group or ring by treating some elements as equal.
    - M8.3.3 Lagrange's Theorem | The size of a subgroup divides the size of the group.
    - M8.3.4 Polynomial Rings | Polynomials as an algebra of their own.
  - M8.4 Advanced Linear Algebra | Inner products and the theorems that classify matrices.
    > lihat juga: M4.6
    - M8.4.1 Inner Product Spaces | Vector spaces with angles and lengths.
    - M8.4.2 Spectral Theorem | Symmetric matrices have an orthonormal basis of eigenvectors.
    - M8.4.3 Jordan Normal Form | The simplest form a matrix takes when it can't be diagonalized.
    - M8.4.4 Positive Definite Matrices | Matrices that act like positive numbers, central to optimization.
  - M8.5 Fourier Analysis | Write signals as sums of waves.
    > lihat juga: M3.6.3
    - M8.5.1 Fourier Series | Periodic functions as sums of sines and cosines.
    - M8.5.2 Fourier Transform | Move a signal from time to frequency and back.
    - M8.5.3 Discrete Fourier Transform | The Fourier transform for sampled data.
    - M8.5.4 Fast Fourier Transform | Compute the discrete transform in n log n steps.
      > nama: Fast Fourier Transform (FFT)
      > bintang: Behind audio and image compression, signal filtering, and fast multiplication of huge numbers.
  - M8.6 Category Theory | The math of composition: objects, arrows, and structure-preserving maps.
    > bintang: Gives precise words for composable design, the kind functional programming and clean module boundaries rely on.
    - M8.6.1 Categories and Functors | Objects with arrows between them, and maps between such systems.
    - M8.6.2 Natural Transformations | Maps between functors that work the same everywhere.
    - M8.6.3 Monads | A structure for chaining computations with context, like errors or async work.
  - M8.7 Lambda Calculus | A tiny formal language of functions that underlies programming languages.
    > bintang: Type systems, closures, and functional languages are lambda calculus in practice.
    - M8.7.1 Beta Reduction | Compute by substituting arguments into function bodies.
    - M8.7.2 Typed Lambda Calculus | Lambda calculus with types that rule out bad programs.
    - M8.7.3 Curry–Howard Correspondence | Programs are proofs and types are propositions.

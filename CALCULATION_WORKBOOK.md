# Stock Candle Pattern Analytics: Worked Mathematical Calculations
*A hands-on, step-by-step math workbook demonstrating the algorithms running under the hood.*

---

## 1. Step-by-Step Z-Score Standardization
*Checks out: How the system scales prices and directions to level the playing field.*

Suppose we have 3 candlesticks with the following raw **Open** price values:
* Candle 1: $10.0$
* Candle 2: $20.0$
* Candle 3: $30.0$

### Step A: Compute the Mean ($\mu$)
$$\mu = \frac{\sum x_i}{N} = \frac{10 + 20 + 30}{3} = \frac{60}{3} = 20.0$$

### Step B: Compute the Variance ($\sigma^2$) & Standard Deviation ($\sigma$)
1. Calculate the squared differences from the mean:
   * $(10 - 20)^2 = (-10)^2 = 100$
   * $(20 - 20)^2 = (0)^2 = 0$
   * $(30 - 20)^2 = (10)^2 = 100$
2. Sum of squares = $100 + 0 + 100 = 200$
3. Variance ($\sigma^2$):
   $$\sigma^2 = \frac{200}{3} \approx 66.67$$
4. Standard Deviation ($\sigma$):
   $$\sigma = \sqrt{66.67} \approx 8.165$$

### Step C: Calculate the Standardized Coordinates ($z = \frac{x - \mu}{\sigma}$)
* **Candle 1**: 
  $$z_1 = \frac{10 - 20}{8.165} = \frac{-10}{8.165} \approx -1.225$$
* **Candle 2**: 
  $$z_2 = \frac{20 - 20}{8.165} = 0.000$$
* **Candle 3**: 
  $$z_3 = \frac{30 - 20}{8.165} = \frac{10}{8.165} \approx 1.225$$

*Result check: The new scaled values have a mean of exact $0.0$ and standard deviation of $1.0$.*

---

## 2. K-Means Clustering (One Full Iteration)
*Checks out: How the algorithm groups 3 candle vectors into $k=2$ clusters.*

Suppose we have 3 standardized candle vectors in 2D space:
* $A_1 = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$ (Bullish candle)
* $A_2 = \begin{bmatrix} 2 \\ 1 \end{bmatrix}$ (Slightly bullish candle)
* $A_3 = \begin{bmatrix} 5 \\ 4 \end{bmatrix}$ (Extremely bullish candle)

We randomly initialize $k = 2$ centroids:
* Centroid 1: $\mu_1 = \begin{bmatrix} 1 \\ 1 \end{bmatrix}$
* Centroid 2: $\mu_2 = \begin{bmatrix} 4 \\ 4 \end{bmatrix}$

### Step A: Distance to Centroid 1 ($\mu_1 = [1, 1]^T$)
Using squared Euclidean distance ($d^2 = (x_1 - x_2)^2 + (y_1 - y_2)^2$):
* For $A_1$: $d^2 = (1 - 1)^2 + (2 - 1)^2 = 0 + 1 = \mathbf{1}$
* For $A_2$: $d^2 = (2 - 1)^2 + (1 - 1)^2 = 1 + 0 = \mathbf{1}$
* For $A_3$: $d^2 = (5 - 1)^2 + (4 - 1)^2 = 16 + 9 = 25$

### Step B: Distance to Centroid 2 ($\mu_2 = [4, 4]^T$)
* For $A_1$: $d^2 = (1 - 4)^2 + (2 - 4)^2 = 9 + 4 = 13$
* For $A_2$: $d^2 = (2 - 4)^2 + (1 - 4)^2 = 4 + 9 = 13$
* For $A_3$: $d^2 = (5 - 4)^2 + (4 - 4)^2 = 1 + 0 = \mathbf{1}$

### Step C: Cluster Assignment Step
We assign each vector to the closest centroid (minimum squared distance):
* $A_1$ is closer to $\mu_1$ ($1 < 13$) $\implies$ **Assigned to Cluster 1**
* $A_2$ is closer to $\mu_1$ ($1 < 13$) $\implies$ **Assigned to Cluster 1**
* $A_3$ is closer to $\mu_2$ ($1 < 25$) $\implies$ **Assigned to Cluster 2**

### Step D: Update Centroids Step
We compute the new centroid as the mean of all vectors in that cluster:
* **New Centroid 1 ($\mu_1'$)**:
  $$\mu_1' = \frac{A_1 + A_2}{2} = \frac{\begin{bmatrix} 1 \\ 2 \end{bmatrix} + \begin{bmatrix} 2 \\ 1 \end{bmatrix}}{2} = \begin{bmatrix} 1.5 \\ 1.5 \end{bmatrix}$$
* **New Centroid 2 ($\mu_2'$)**:
  $$\mu_2' = \frac{A_3}{1} = \begin{bmatrix} 5 \\ 4 \end{bmatrix}$$

---

## 3. Cosine vs. Euclidean Similarity Calculations
*Checks out: Why the two heatmaps on your frontend look completely different.*

Suppose we have two timeframe vectors representing average standardized candles:
* Timeframe 1: $\mathbf{u} = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$
* Timeframe 2: $\mathbf{v} = \begin{bmatrix} 2 \\ 4 \end{bmatrix}$ (pointed in the exact same direction, but twice the magnitude)

### Calculation A: Cosine Similarity
1. **Dot Product ($\mathbf{u} \cdot \mathbf{v}$)**:
   $$\mathbf{u} \cdot \mathbf{v} = (1 \times 2) + (2 \times 4) = 2 + 8 = 10$$
2. **Magnitude of $\mathbf{u}$ ($\|\mathbf{u}\|$)**:
   $$\|\mathbf{u}\| = \sqrt{1^2 + 2^2} = \sqrt{5} \approx 2.236$$
3. **Magnitude of $\mathbf{v}$ ($\|\mathbf{v}\|$)**:
   $$\|\mathbf{v}\| = \sqrt{2^2 + 4^2} = \sqrt{20} \approx 4.472$$
4. **Cosine Similarity**:
   $$\text{Cosine Similarity} = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\| \|\mathbf{v}\|} = \frac{10}{\sqrt{5} \times \sqrt{20}} = \frac{10}{\sqrt{100}} = \frac{10}{10} = \mathbf{1.000}$$
*Interpretation: Cosine similarity is exactly 1.0 (perfect correlation) because the angles are identical. The ratio of their shapes is the same!*

### Calculation B: Euclidean Similarity
1. **Euclidean Distance ($d(\mathbf{u}, \mathbf{v})$)**:
   $$d(\mathbf{u}, \mathbf{v}) = \sqrt{(1 - 2)^2 + (2 - 4)^2} = \sqrt{(-1)^2 + (-2)^2} = \sqrt{1 + 4} = \sqrt{5} \approx 2.236$$
2. **Euclidean Similarity**:
   $$\text{Euclidean Similarity} = \frac{1}{1 + d(\mathbf{u}, \mathbf{v})} = \frac{1}{1 + 2.236} = \frac{1}{3.236} \approx \mathbf{0.309}$$
*Interpretation: The similarity is only 30.9% because the coordinates are physically distant from each other.*

---

## 4. Principal Component Analysis (PCA)
*Checks out: How the system compresses 2D points down to 1D for visual plotting.*

Suppose we have 3 data points in 2D space:
* $P_1 = \begin{bmatrix} 1 \\ 2 \end{bmatrix}$, $P_2 = \begin{bmatrix} 2 \\ 3 \end{bmatrix}$, $P_3 = \begin{bmatrix} 3 \\ 4 \end{bmatrix}$

### Step A: Center the Data (Subtract the Means)
1. Mean of $x$: $\mu_x = \frac{1+2+3}{3} = 2.0$
2. Mean of $y$: $\mu_y = \frac{2+3+4}{3} = 3.0$
3. Subtract means to create centered data matrix $X_c$:
   * $P_{1c} = \begin{bmatrix} 1 - 2 \\ 2 - 3 \end{bmatrix} = \begin{bmatrix} -1 \\ -1 \end{bmatrix}$
   * $P_{2c} = \begin{bmatrix} 2 - 2 \\ 3 - 3 \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix}$
   * $P_{3c} = \begin{bmatrix} 3 - 2 \\ 4 - 3 \end{bmatrix} = \begin{bmatrix} 1 \\ 1 \end{bmatrix}$

   $$X_c = \begin{bmatrix} -1 & -1 \\ 0 & 0 \\ 1 & 1 \end{bmatrix}$$

### Step B: Compute the Covariance Matrix ($\Sigma$)
Since data is centered, $\Sigma = \frac{1}{N-1} X_c^T X_c$:
$$\Sigma = \frac{1}{2} \begin{bmatrix} -1 & 0 & 1 \\ -1 & 0 & 1 \end{bmatrix} \begin{bmatrix} -1 & -1 \\ 0 & 0 \\ 1 & 1 \end{bmatrix} = \frac{1}{2} \begin{bmatrix} 2 & 2 \\ 2 & 2 \end{bmatrix} = \begin{bmatrix} 1 & 1 \\ 1 & 1 \end{bmatrix}$$

### Step C: Find Eigenvalues ($\lambda$)
Solve the characteristic equation $\det(\Sigma - \lambda I) = 0$:
$$\det \begin{bmatrix} 1-\lambda & 1 \\ 1 & 1-\lambda \end{bmatrix} = 0$$
$$(1-\lambda)^2 - 1 = 0 \implies 1 - 2\lambda + \lambda^2 - 1 = 0 \implies \lambda^2 - 2\lambda = 0$$
$$\lambda(\lambda - 2) = 0$$

* The eigenvalues are **$\lambda_1 = 2$** and **$\lambda_2 = 0$**.
* The first eigenvalue captures $100\%$ of the variance ($\frac{2}{2+0} = 1.0$), since all points lie strictly on a diagonal line.

### Step D: Find the Principal Eigenvector ($\mathbf{v}_1$)
Substitute $\lambda_1 = 2$ into $(\Sigma - \lambda I)\mathbf{v} = 0$:
$$\begin{bmatrix} 1-2 & 1 \\ 1 & 1-2 \end{bmatrix} \begin{bmatrix} v_x \\ v_y \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix} \implies \begin{bmatrix} -1 & 1 \\ 1 & -1 \end{bmatrix} \begin{bmatrix} v_x \\ v_y \end{bmatrix} = \begin{bmatrix} 0 \\ 0 \end{bmatrix} \implies -v_x + v_y = 0 \implies v_x = v_y$$

To make it a unit vector ($\|\mathbf{v}\|_2 = 1$):
$$\mathbf{v}_1 = \begin{bmatrix} \frac{1}{\sqrt{2}} \\ \frac{1}{\sqrt{2}} \end{bmatrix} \approx \begin{bmatrix} 0.707 \\ 0.707 \end{bmatrix}$$

### Step E: Project Points Down to 1D Coordinate ($z_i$)
To project centered points onto the principal axis:
* **Point 1**: 
  $$z_1 = \mathbf{v}_1^T P_{1c} = \begin{bmatrix} 0.707 & 0.707 \end{bmatrix} \begin{bmatrix} -1 \\ -1 \end{bmatrix} = -0.707 - 0.707 = \mathbf{-1.414}$$
* **Point 2**: 
  $$z_2 = \mathbf{v}_1^T P_{2c} = \begin{bmatrix} 0.707 & 0.707 \end{bmatrix} \begin{bmatrix} 0 \\ 0 \end{bmatrix} = \mathbf{0.000}$$
* **Point 3**: 
  $$z_3 = \mathbf{v}_1^T P_{3c} = \begin{bmatrix} 0.707 & 0.707 \end{bmatrix} \begin{bmatrix} 1 \\ 1 \end{bmatrix} = 0.707 + 0.707 = \mathbf{1.414}$$

---
*Workbook created for structural review of the Candle Pattern platform.*

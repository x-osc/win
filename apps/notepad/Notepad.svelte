<script lang="ts"></script>

<div class="container">
  <header>menu bar or smth idk</header>
  <textarea></textarea>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  header {
    background-color: #696969;
    color: #ffffff;
    padding: 0.3rem 1rem;
    text-align: center;
    font-size: 1.25rem;
    font-weight: bold;
  }

  textarea {
    flex: 1;
    box-sizing: border-box;
    margin-top: 0.4rem;
    padding: 1rem;
    border: 1px solid #333333;
    resize: none;
    font-size: 1rem;
    line-height: 1.5;
    background-color: #ffffff;
    color: #333333;
    width: 100%;
    outline: none;
  }

  textarea::placeholder {
    color: #aaaaaa;
  }
</style>

import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";
/**Global state of the app
 *  --Search Object
 *  --Current recipe object
 *  --Shopping list object
 *  --Liked receipes
 */
const state = {};
/**This is the search controller */
const controlSearch = async () => {
  // 1. Get query from view
  const query = searchView.getInput();

  if (query) {
    //  2.New sate object add to state
    state.search = new Search(query);

    //  3.Prepare UI for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    try {
      //  4.Search for receipe
      await state.search.getResults();

      //  5.Render results on UI
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (error) {
      alert("Something went wrong with search");
      clearLoader();
    }
  }
};
elements.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-inline");
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

/**Recipe Controller */

const controlRecipe = async () => {
  // Get ID from url and omitt the #
  const id = window.location.hash.replace("#", "");

  if (id) {
    //  1.Prepare the ui

    recipeView.clearRecipe();
    renderLoader(elements.recipe);
    // HighLight Selected search item
    if (state.search) searchView.highlightSelected(id);
    //  2.Create new recipe object
    state.recipe = new Recipe(id);

    try {
      //  3.Get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();
      //  4. calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();
      //  5. Render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
    } catch (error) {
      console.log(error);
      alert("error processing data");
    }
  }
};

["hashchange", "load"].forEach((event) =>
  window.addEventListener(event, controlRecipe)
);

/**
 * List controller
 */
const controlList = () => {
  //Create a new list if there is none yet
  if (!state.list) state.list = new List();

  //ADD each ingredients in the list and user Interface
  state.recipe.ingredients.forEach((el) => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  });
};

//Handle delete and update list items event
elements.shopping.addEventListener("click", (el) => {
  const id = el.target.closest(".shopping__item").dataset.itemid;

  //delete event
  if (el.target.matches(".shopping__delete, .shopping__delete *")) {
    //Delete both from state and UI
    state.list.deleteItem(id);
    listView.deleteItem(id);
    //Handle count update
  } else if (el.target.matches(".shopping__count-value")) {
    const val = parseFloat(el.target.value);
    state.list.updateCount(id, val);
  }
});

/**
 * Like controller
 */

const controlLike = () => {
  if (!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;
  //User not yet liked current recipe
  if (!state.likes.isLiked(currentID)) {
    //Add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    );
    //Toggle has liked Button
    likesView.toggleLikeBtn(true);

    //Add like to the UI list
    likesView.renderLike(newLike);
  } else {
    //Remove like to the state
    state.likes.deleteLike(currentID);
    //Toggle has liked Button
    likesView.toggleLikeBtn(false);
    //Remove like to the UI list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

//Restoring Likes when the page loads
window.addEventListener("load", () => {
  state.likes = new Likes();

  //Restore Likes
  state.likes.readStorage();

  //Toggle Liked Button
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //Render the exisitng likes
  state.likes.likes.forEach((like) => likesView.renderLike(like));
});

//Handling recipe button clicks
elements.recipe.addEventListener("click", (e) => {
  if (e.target.matches(".btn-decrease,.btn-decrease *")) {
    //Decrease if clicked
    if (state.recipe.servings > 1) {
      state.recipe.updateServings("desc");
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches(".btn-increase,.btn-increase *")) {
    //increase if clicked
    state.recipe.updateServings("inc");
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches(".recipe__btn--add *")) {
    //Add ingredients to Shopping List
    controlList();
  } else if (e.target.matches(".recipe__love,.recipe__love *")) {
    //Like controller
    controlLike();
  }
});

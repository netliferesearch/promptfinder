// --- Auth view toggle logic ---

let _authChooserInitialized = false;

export function initializeAuthChooser() {
  if (_authChooserInitialized) return;
  // Auth method chooser toggling can be initialized any time after elements exist
  const authMethods = document.getElementById('auth-methods');
  const emailLoginForm = document.getElementById('login-form');
  const showEmailLoginButton = document.getElementById('show-email-login-button');
  const authMethodBackButton = document.getElementById('auth-method-back-button');

  if (showEmailLoginButton && emailLoginForm && authMethods && authMethodBackButton) {
    showEmailLoginButton.addEventListener('click', () => {
      authMethods.classList.add('hidden');
      emailLoginForm.classList.remove('hidden');
      authMethodBackButton.classList.remove('hidden');
    });
    authMethodBackButton.addEventListener('click', () => {
      emailLoginForm.classList.add('hidden');
      authMethods.classList.remove('hidden');
      authMethodBackButton.classList.add('hidden');
    });
    _authChooserInitialized = true;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Handle "Back to list" button in auth views
  const authBackToListBtn = document.getElementById('auth-back-to-list-button');
  // const authBackToListBtnSignup = document.getElementById('auth-back-to-list-button-signup'); // handled in showSignUp()
  function handleAuthBackToList() {
    // Hide auth view, show main content
    const authView = document.getElementById('auth-view');
    const mainContent = document.getElementById('main-content');
    if (authView) authView.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');

    // Restore original popup constraints using class-based approach
    document.body.classList.remove('auth-view-active');
  }
  if (authBackToListBtn) {
    authBackToListBtn.addEventListener('click', handleAuthBackToList);
  }
  // Do not bind signup back button to main list; we'll wire it to go back to sign-in methods below
  const authView = document.getElementById('auth-view');
  const loginCard = authView?.querySelector('.auth-card');
  const signupForm = document.getElementById('signup-form');
  const signupMethodsCard = document.getElementById('signup-methods');
  const showEmailSignupButton = document.getElementById('show-email-signup-button');
  const signupMethodsBackButton = document.getElementById('signup-methods-back-button');
  const signupGoogleMethodsButton = document.getElementById('signup-google-methods-button');
  const showSignupLink = document.getElementById('show-signup-link');
  const showLoginLink = document.getElementById('show-login-link');
  const showSignupRow = document.getElementById('show-signup-row');
  const header = document.querySelector('.pf-header');
  const homeButton = document.getElementById('home-button');

  // Ensure method chooser is initialized even if this module loads after DOMContentLoaded
  initializeAuthChooser();

  // --- Dynamic Auth Text Injection ---
  function setAuthTexts() {
    // Sign in view
    const signinTitle = document.querySelector('.auth-card .auth-title');
    if (signinTitle) signinTitle.textContent = getText('SIGNIN_TITLE');
    const signinSubtext = document.querySelector('.auth-card .auth-subtext');
    if (signinSubtext) signinSubtext.textContent = getText('SIGNIN_SUBTEXT');
    const signinEmailLabel = document.querySelector('#login-form label[for="login-email"]');
    if (signinEmailLabel) signinEmailLabel.textContent = getText('SIGNIN_EMAIL_LABEL');
    const signinEmailInput = document.getElementById('login-email');
    if (signinEmailInput) signinEmailInput.placeholder = getText('SIGNIN_EMAIL_PLACEHOLDER');
    const signinEmailHint = document.querySelector('#login-form .email-privacy-note');
    if (signinEmailHint) signinEmailHint.textContent = getText('SIGNIN_EMAIL_HINT');
    const signinPasswordLabel = document.querySelector('#login-form label[for="login-password"]');
    if (signinPasswordLabel) signinPasswordLabel.textContent = getText('SIGNIN_PASSWORD_LABEL');
    const signinPasswordInput = document.getElementById('login-password');
    if (signinPasswordInput)
      signinPasswordInput.placeholder = getText('SIGNIN_PASSWORD_PLACEHOLDER');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    if (forgotPasswordLink) forgotPasswordLink.textContent = getText('SIGNIN_FORGOT_PASSWORD');
    const signinButton = document.querySelector('#login-form .auth-signin-btn');
    if (signinButton) signinButton.textContent = getText('SIGNIN_BUTTON');
    const signinGoogleButton = document.getElementById('google-signin-button');
    if (signinGoogleButton)
      signinGoogleButton.lastChild.textContent = ' ' + getText('SIGNIN_GOOGLE_BUTTON');
    const signinDivider = document.querySelector('.auth-card .auth-divider span');
    if (signinDivider) signinDivider.textContent = getText('SIGNIN_OR_CONTINUE_WITH');
    const signinSignupRow = document.querySelector('#show-signup-row span');
    if (signinSignupRow) signinSignupRow.textContent = getText('SIGNIN_SIGNUP_ROW');
    const signinSignupLink = document.getElementById('show-signup-link');
    if (signinSignupLink) signinSignupLink.textContent = getText('SIGNIN_SIGNUP_LINK');

    // Sign up view
    const signupTitle = document.querySelector('#signup-form .auth-title');
    if (signupTitle) signupTitle.textContent = getText('SIGNUP_TITLE');
    const signupSubtext = document.querySelector('#signup-form .auth-subtext');
    if (signupSubtext) signupSubtext.textContent = getText('SIGNUP_SUBTEXT');
    const signupDisplayLabel = document.querySelector(
      '#signup-form label[for="signup-display-name"]'
    );
    if (signupDisplayLabel) signupDisplayLabel.textContent = getText('SIGNUP_DISPLAY_LABEL');
    const signupDisplayInput = document.getElementById('signup-display-name');
    if (signupDisplayInput) signupDisplayInput.placeholder = getText('SIGNUP_DISPLAY_PLACEHOLDER');
    const signupDisplayHint = document.querySelector('#signup-form .signup-hint');
    if (signupDisplayHint) signupDisplayHint.textContent = getText('SIGNUP_DISPLAY_HINT');
    const signupEmailLabel = document.querySelector('#signup-form label[for="signup-email"]');
    if (signupEmailLabel) signupEmailLabel.textContent = getText('SIGNUP_EMAIL_LABEL');
    const signupEmailInput = document.getElementById('signup-email');
    if (signupEmailInput) signupEmailInput.placeholder = getText('SIGNUP_EMAIL_PLACEHOLDER');
    const signupEmailHint = document.querySelector('#signup-form .email-privacy-note.signup-hint');
    if (signupEmailHint) signupEmailHint.textContent = getText('SIGNUP_EMAIL_HINT');
    const signupPasswordLabel = document.querySelector('#signup-form label[for="signup-password"]');
    if (signupPasswordLabel) signupPasswordLabel.textContent = getText('SIGNUP_PASSWORD_LABEL');
    const signupPasswordInput = document.getElementById('signup-password');
    if (signupPasswordInput)
      signupPasswordInput.placeholder = getText('SIGNUP_PASSWORD_PLACEHOLDER');
    const signupPasswordHint = document.querySelector(
      '#signup-form .form-group.password-group .signup-hint'
    );
    if (signupPasswordHint) signupPasswordHint.textContent = getText('SIGNUP_PASSWORD_HINT');
    const signupButton = document.querySelector('#signup-form .signup-btn');
    if (signupButton) signupButton.textContent = getText('SIGNUP_BUTTON');
    const signupDivider = document.querySelector('#signup-form .auth-divider span');
    if (signupDivider) signupDivider.textContent = getText('SIGNUP_OR_CONTINUE_WITH');
    const signupGoogleButton = document.getElementById('google-signup-button');
    if (signupGoogleButton)
      signupGoogleButton.lastChild.textContent = ' ' + getText('SIGNUP_GOOGLE_BUTTON');
    const signupLoginRow = document.querySelector('.signup-bottom-row span');
    if (signupLoginRow) signupLoginRow.textContent = getText('SIGNUP_LOGIN_ROW');
    const signupLoginLink = document.getElementById('show-login-link');
    if (signupLoginLink) signupLoginLink.textContent = getText('SIGNUP_LOGIN_LINK');
  }

  setAuthTexts();

  function showSignIn() {
    if (signupForm) signupForm.classList.add('hidden');
    if (loginCard) loginCard.classList.remove('hidden');
    if (showSignupRow) showSignupRow.style.display = '';
    if (header) header.style.display = '';

    // Default to method chooser
    const am = document.getElementById('auth-methods');
    const elf = document.getElementById('login-form');
    const back = document.getElementById('auth-method-back-button');
    if (am && elf && back) {
      am.classList.remove('hidden');
      elf.classList.add('hidden');
      back.classList.add('hidden');
    }
    if (signupMethodsCard) signupMethodsCard.classList.add('hidden');
    if (signupForm) signupForm.classList.add('hidden');
  }
  function showSignUp() {
    if (loginCard) loginCard.classList.add('hidden');
    // Show signup methods by default (mirror sign-in)
    if (signupMethodsCard) signupMethodsCard.classList.remove('hidden');
    if (signupForm) signupForm.classList.add('hidden');
    if (showSignupRow) showSignupRow.style.display = 'none';
    if (header) header.style.display = '';
    // Ensure signup layout is compact and centered (no scroll needed)
    const authContainer = document.querySelector('#auth-view.auth-container');
    if (authContainer) authContainer.classList.remove('signup-active');

    // In signup view, back button should go to sign-in methods (not main list)
    const backBtn = document.getElementById('auth-back-to-list-button-signup');
    if (backBtn) {
      backBtn.onclick = e => {
        e.preventDefault();
        // Hide signup, show login card with method chooser
        if (signupForm) signupForm.classList.add('hidden');
        if (signupMethodsCard) signupMethodsCard.classList.add('hidden');
        if (loginCard) loginCard.classList.remove('hidden');
        if (showSignupRow) showSignupRow.style.display = '';
        const authContainer2 = document.querySelector('#auth-view.auth-container');
        if (authContainer2) authContainer2.classList.remove('signup-active');
        const am = document.getElementById('auth-methods');
        const elf = document.getElementById('login-form');
        const back = document.getElementById('auth-method-back-button');
        if (am && elf && back) {
          am.classList.remove('hidden');
          elf.classList.add('hidden');
          back.classList.add('hidden');
        }
      };
    }

    // Wire signup methods actions
    if (showEmailSignupButton && signupForm && signupMethodsCard) {
      showEmailSignupButton.onclick = () => {
        signupMethodsCard.classList.add('hidden');
        signupForm.classList.remove('hidden');
      };
    }
    if (signupMethodsBackButton && signupMethodsCard) {
      signupMethodsBackButton.onclick = e => {
        e.preventDefault();
        // Back to sign-in methods
        if (signupMethodsCard) signupMethodsCard.classList.add('hidden');
        if (loginCard) loginCard.classList.remove('hidden');
        if (showSignupRow) showSignupRow.style.display = '';
        const am = document.getElementById('auth-methods');
        const elf = document.getElementById('login-form');
        const back = document.getElementById('auth-method-back-button');
        if (am && elf && back) {
          am.classList.remove('hidden');
          elf.classList.add('hidden');
          back.classList.add('hidden');
        }
      };
    }
    if (signupGoogleMethodsButton) {
      signupGoogleMethodsButton.onclick = () => {
        const googleSignUpButton = document.getElementById('google-signup-button');
        if (googleSignUpButton) googleSignUpButton.click();
      };
    }
  }

  if (showSignupLink && signupForm && loginCard) {
    showSignupLink.addEventListener('click', e => {
      e.preventDefault();
      showSignUp();
    });
  }
  if (showLoginLink && signupForm && loginCard) {
    showLoginLink.addEventListener('click', e => {
      e.preventDefault();
      showSignIn();
    });
  }

  // On load, always show header
  if (header) header.style.display = '';

  // Home button behavior: return to main view unless we're inside a sub-flow that must stay
  if (homeButton) {
    homeButton.addEventListener('click', e => {
      e.preventDefault();
      // If auth view is visible, decide context-aware behavior
      const authViewVisible =
        document.getElementById('auth-view')?.classList.contains('hidden') === false;
      if (authViewVisible) {
        // If signup form is open, go to signup methods (avoid jumping straight to list)
        const signupFormVisible =
          document.getElementById('signup-form') &&
          !document.getElementById('signup-form').classList.contains('hidden');
        const signupMethodsCard = document.getElementById('signup-methods');
        if (signupFormVisible && signupMethodsCard) {
          // mirror back-to-methods behavior
          signupMethodsCard.classList.remove('hidden');
          document.getElementById('signup-form').classList.add('hidden');
          return;
        }
        // If login email form is open, go back to sign-in methods
        const loginFormVisible =
          document.getElementById('login-form') &&
          !document.getElementById('login-form').classList.contains('hidden');
        const authMethods = document.getElementById('auth-methods');
        const authBackLink = document.getElementById('auth-method-back-button');
        if (loginFormVisible && authMethods && authBackLink) {
          authMethods.classList.remove('hidden');
          document.getElementById('login-form').classList.add('hidden');
          authBackLink.classList.add('hidden');
          return;
        }
      }
      // Default: show main content view
      const mainContent = document.getElementById('main-content');
      const authView = document.getElementById('auth-view');
      if (mainContent) mainContent.classList.remove('hidden');
      if (authView) authView.classList.add('hidden');
      document.body.classList.remove('auth-view-active');
      // Also restore sign-in chooser state
      const am = document.getElementById('auth-methods');
      const elf = document.getElementById('login-form');
      const back = document.getElementById('auth-method-back-button');
      if (am && elf && back) {
        am.classList.remove('hidden');
        elf.classList.add('hidden');
        back.classList.add('hidden');
      }
    });
  }
});

// Test helper to set allPrompts for unit tests
export const _setAllPromptsForTest = v => {
  allPrompts = v;
};
// (Removed duplicate: Always hide the delete confirmation dialog when entering add mode)
// Cancel edit handler for in-place editing
function handleCancelEditPrompt(prompt) {
  // Clear draft and revert to original data
  getDraftStorage()
    .remove(editDraftKey(prompt.id))
    .then(() => {
      // Remove global edit mode class from body
      document.body.classList.remove('editing-prompt');

      // Remove edit mode heading if it exists
      const editHeading = document.getElementById('edit-mode-heading');
      if (editHeading && editHeading.parentNode) {
        editHeading.parentNode.removeChild(editHeading);
      }

      // Show elements that were hidden during edit mode
      // Will be handled by displayPromptDetails

      displayPromptDetails(prompt);
    });
}
// --- In-place editing state and helpers ---
let promptDetailEditableFieldsWrapperEl;
let promptDetailStaticFieldsWrapperEl;
let promptEditActionsBarEl;
let promptOwnerActionsBarEl;
// Draft storage keys
const editDraftKey = promptId => `editDraft_${promptId}`;

// Add a constant for the add prompt draft key
const ADD_DRAFT_KEY = 'addDraft';

// Function to show inline add prompt form
function showAddPromptInline() {
  // Always hide the delete confirmation dialog when entering add mode
  var localDeleteConfirmationEl = document.getElementById('delete-confirmation');
  if (localDeleteConfirmationEl) {
    localDeleteConfirmationEl.classList.add('hidden');
  }
  if (!promptDetailsSectionEl) return;

  // Cache DOM elements if needed
  if (!promptDetailEditableFieldsWrapperEl)
    promptDetailEditableFieldsWrapperEl = document.getElementById(
      'prompt-detail-editable-fields-wrapper'
    );
  if (!promptDetailStaticFieldsWrapperEl)
    promptDetailStaticFieldsWrapperEl = document.getElementById(
      'prompt-detail-static-fields-wrapper'
    );
  if (!promptEditActionsBarEl)
    promptEditActionsBarEl = document.getElementById('prompt-edit-actions-bar');
  if (!promptOwnerActionsBarEl)
    promptOwnerActionsBarEl = document.getElementById('prompt-owner-actions-bar');

  // Get draft storage to retrieve any previously entered data
  const draftStorage = getDraftStorage();

  // Track prompt creation start time for analytics
  window.promptCreateStartTime = Date.now();

  // Track content creation funnel - form opened
  if (window.DebugAnalytics && window.firebaseAuthCurrentUser) {
    window.DebugAnalytics.trackContentCreationFunnel({
      step: 'form_opened',
      stepNumber: 2,
      userId: window.firebaseAuthCurrentUser.uid,
      trigger: 'fab_button',
    });
  }

  // Retrieve any existing draft
  draftStorage.get(ADD_DRAFT_KEY).then(draft => {
    // Set up edit view similar to showEditMode but for a new prompt
    promptDetailEditableFieldsWrapperEl.innerHTML = renderAddPromptForm(draft);
    promptDetailEditableFieldsWrapperEl.classList.remove('hidden');
    promptDetailStaticFieldsWrapperEl.classList.add('hidden');

    // Show edit actions bar but toggle between edit and add buttons
    if (promptEditActionsBarEl) {
      promptEditActionsBarEl.classList.remove('hidden');
      const editButtons = document.getElementById('edit-prompt-buttons');
      const addButtons = document.getElementById('add-prompt-buttons');
      if (editButtons) editButtons.classList.add('hidden');
      if (addButtons) addButtons.classList.remove('hidden');
    }

    if (promptOwnerActionsBarEl) promptOwnerActionsBarEl.classList.add('hidden');

    // Add classes to body for styling - both editing-prompt for shared styles and adding-prompt for add-specific styles
    document.body.classList.add('editing-prompt', 'adding-prompt');

    // Add editing class to prompt details section
    if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('editing');

    // Hide category dropdown bar
    const categoryDropdownBar = document.querySelector('.category-dropdown-bar');
    if (categoryDropdownBar) categoryDropdownBar.classList.add('hidden');

    // Hide additional elements in add mode
    // 1. Prompt title and actions (copy, favorite)
    const promptHeader = document.querySelector('.prompt-item__header');
    if (promptHeader) promptHeader.classList.add('hidden');

    // Add a heading to indicate add mode
    const editHeading = document.createElement('div');
    editHeading.id = 'edit-mode-heading';
    editHeading.classList.add('edit-mode-heading');
    editHeading.innerHTML = `<h2>${getText('ADD_NEW_PROMPT')}</h2>`;
    if (promptDetailEditableFieldsWrapperEl) {
      promptDetailEditableFieldsWrapperEl.insertAdjacentElement('beforebegin', editHeading);
    }

    // 2. Prompt category and tags
    const promptCategory = document.getElementById('prompt-detail-category');
    if (promptCategory) promptCategory.classList.add('hidden');

    const promptTags = document.getElementById('prompt-detail-tags');
    if (promptTags) promptTags.classList.add('hidden');

    // 3. Back to list button
    const backToListButton = document.getElementById('back-to-list-button');
    if (backToListButton) backToListButton.classList.add('hidden');

    // Hide ratings
    if (userStarRatingEl && userStarRatingEl.parentElement) {
      userStarRatingEl.parentElement.classList.add('hidden');
    }
    if (communityRatingSectionEl) {
      communityRatingSectionEl.classList.add('hidden');
    }

    // Set up form listeners
    const form = document.getElementById('prompt-add-form');
    if (form) {
      // Wire up Cancel button
      const cancelAddBtn = document.getElementById('cancel-add-prompt-button');
      if (cancelAddBtn) {
        cancelAddBtn.onclick = () => handleCancelAddPrompt();
      }

      // Wire up Save button
      const saveAddBtn = document.getElementById('save-add-prompt-button');
      if (saveAddBtn) {
        saveAddBtn.onclick = () => handleSaveAddPrompt();
      }

      // Set up input listeners for draft persistence
      form.addEventListener('input', () => {
        const data = {
          title: document.getElementById('add-title')?.value || '',
          description: document.getElementById('add-description')?.value || '',
          text: document.getElementById('add-text')?.value || '',
          category: document.getElementById('add-category')?.value || '',
          tags: document.getElementById('add-tags')?.value || '',
          isPrivate: document.getElementById('add-private')?.checked || false,
          aiTools:
            document
              .getElementById('add-tools')
              ?.value.split(',')
              .map(t => t.trim())
              .filter(Boolean) || [],
        };
        draftStorage.set(ADD_DRAFT_KEY, data);
      });
    }
  });
}

function renderAddPromptForm(draft = null) {
  // Use PROMPT_CATEGORIES from window or fallback
  const categories = window.PROMPT_CATEGORIES || [
    'Brainstorming & Idea Generation',
    'Planning & Strategy',
    'Writing & Content Creation',
    'Design & Visual Thinking',
    'Code & Technical Productivity',
    'Research & Analysis',
    'Execution & Delivery',
    'Optimization & Testing',
    'Decision-Making & Clarity',
    'Personal Productivity & Focus',
    'Workshop & Meeting Support',
    'Client Communication & Sales',
    'Team Collaboration & Alignment',
    'Professional Development',
    'Creative Projects & Hobbies',
    'Life Admin & Personal Insight',
  ];

  // Use draft values if available
  const title = draft?.title || '';
  const description = draft?.description || '';
  const text = draft?.text || '';
  const category = draft?.category || '';
  const tags = draft?.tags || '';
  const targetAiTools = draft?.aiTools?.join(', ') || '';
  const isPrivate = draft?.isPrivate || false;

  return `
    <form id="prompt-add-form" autocomplete="off" novalidate>
      <div class="form-group">
        <label for="add-title">${getText('TITLE_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="add-title" name="title" required maxlength="100" rows="2" aria-required="true">${Utils.escapeHTML(title)}</textarea>
      </div>
      <div class="form-group">
        <label for="add-description">${getText('DESCRIPTION_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="add-description" name="description" required maxlength="500" aria-required="true">${Utils.escapeHTML(description)}</textarea>
      </div>
      <div class="form-group">
        <label for="add-text">${getText('PROMPT_TEXT_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="add-text" name="text" required aria-required="true">${Utils.escapeHTML(text)}</textarea>
      </div>
      <div class="form-group">
        <label for="add-category">${getText('CATEGORY_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <select id="add-category" name="category" required aria-required="true">
          <option value="">${getText('SELECT_CATEGORY')}</option>
          ${categories.map(cat => `<option value="${Utils.escapeHTML(cat)}" ${category === cat ? 'selected' : ''}>${Utils.escapeHTML(cat)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="add-tags">${getText('TAGS_LABEL')}:</label>
        <input type="text" id="add-tags" name="tags" value="${Utils.escapeHTML(tags)}" />
      </div>
      <div class="form-group">
        <label for="add-tools">${getText('TARGET_AI_TOOLS_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <input type="text" id="add-tools" name="targetAiTools" required aria-required="true" value="${Utils.escapeHTML(targetAiTools)}" />
      </div>
      <div class="form-group">
        <input type="checkbox" id="add-private" name="isPrivate" ${isPrivate ? 'checked' : ''} />
        <label for="add-private">${getText('MAKE_PRIVATE_LABEL')}</label>
      </div>
    </form>
  `;
}

function getAddFormData() {
  const form = document.getElementById('prompt-add-form');
  if (!form) return {};

  return {
    title: document.getElementById('add-title')?.value.trim() || '',
    description: document.getElementById('add-description')?.value.trim() || '',
    text: document.getElementById('add-text')?.value.trim() || '',
    category: document.getElementById('add-category')?.value || '',
    tags: document
      .getElementById('add-tags')
      ?.value.split(',')
      .map(t => t.trim())
      .filter(Boolean),
    targetAiTools: document
      .getElementById('add-tools')
      ?.value.split(',')
      .map(t => t.trim())
      .filter(Boolean),
    isPrivate: document.getElementById('add-private')?.checked || false,
  };
}

function handleCancelAddPrompt() {
  // Remove global edit mode classes from body
  document.body.classList.remove('editing-prompt', 'adding-prompt');

  // Remove edit mode heading if it exists
  const editHeading = document.getElementById('edit-mode-heading');
  if (editHeading && editHeading.parentNode) {
    editHeading.parentNode.removeChild(editHeading);
  }

  // Get the form data before closing and save it to draft storage
  const form = document.getElementById('prompt-add-form');
  if (form) {
    const data = {
      title: document.getElementById('add-title')?.value || '',
      description: document.getElementById('add-description')?.value || '',
      text: document.getElementById('add-text')?.value || '',
      category: document.getElementById('add-category')?.value || '',
      tags: document.getElementById('add-tags')?.value || '',
      isPrivate: document.getElementById('add-private')?.checked || false,
      aiTools:
        document
          .getElementById('add-tools')
          ?.value.split(',')
          .map(t => t.trim())
          .filter(Boolean) || [],
    };
    // Save the draft data so it's available if user returns
    getDraftStorage().set(ADD_DRAFT_KEY, data);
  }

  // Return to prompt list view
  showPromptList();
}

async function handleSaveAddPrompt() {
  const form = document.getElementById('prompt-add-form');
  if (!form) return;
  const data = getAddFormData();

  // Validate required fields and show inline, accessible error message
  const requiredFields = [
    { id: 'add-title', name: 'Title' },
    { id: 'add-description', name: 'Description' },
    { id: 'add-text', name: 'Prompt Text' },
    { id: 'add-category', name: 'Category' },
    { id: 'add-tools', name: 'Target AI Tools' },
  ];
  let firstInvalid = null;
  let missingFields = [];
  requiredFields.forEach(field => {
    const el = document.getElementById(field.id);
    let value = el?.value?.trim() || '';
    if (field.id === 'add-category' && value === '') value = '';
    if (
      field.id === 'add-tools' &&
      value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean).length === 0
    )
      value = '';
    if (!value) {
      missingFields.push(field.name);
      if (!firstInvalid) firstInvalid = el;
      if (el) {
        el.setAttribute('aria-invalid', 'true');
        el.classList.add('input-error');
      }
    } else if (el) {
      el.removeAttribute('aria-invalid');
      el.classList.remove('input-error');
    }
  });
  // Show error using the global message system
  if (missingFields.length > 0) {
    Utils.handleError(
      textManager.format('REQUIRED_FIELDS_ERROR', { fields: missingFields.join(', ') }),
      {
        userVisible: true,
        type: 'error',
        timeout: 5000,
        specificErrorElement: null,
      }
    );
    if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
    return;
  }

  try {
    const newPrompt = await PromptData.addPrompt(data);
    if (newPrompt && newPrompt.id) {
      // Clear the draft storage since we successfully saved the prompt
      const draftStorage = getDraftStorage();
      await draftStorage.remove(ADD_DRAFT_KEY);

      Utils.showConfirmationMessage(getText('PROMPT_ADDED_SUCCESS'));

      // Notify any listeners (like the popup) that a prompt was modified (silence connection warning)
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'PROMPT_ADDED_OR_MODIFIED' }, _response => {
          if (
            chrome.runtime.lastError &&
            !chrome.runtime.lastError.message.includes('Could not establish connection')
          ) {
            console.warn(
              'Could not send PROMPT_ADDED_OR_MODIFIED message:',
              chrome.runtime.lastError.message
            );
          }
        });
      }

      // Show the details view for the newly added prompt
      await loadAndDisplayData();
      if (newPrompt && newPrompt.id) {
        // If you want to always reload from DB, use: await viewPromptDetails(newPrompt.id);
        displayPromptDetails(newPrompt);

        // Track content selection for prompt creation
        if (window.DebugAnalytics) {
          window.DebugAnalytics.trackContentSelection({
            contentType: 'prompt',
            contentId: newPrompt.id,
            promptId: newPrompt.id,
            promptCategory: newPrompt.category || 'unknown',
            source: 'prompt_form',
            method: 'create',
            userRating: 0,
            isFavorite: false,
          });

          // Track custom prompt creation event
          window.DebugAnalytics.trackPromptCreate({
            id: newPrompt.id,
            category: newPrompt.category,
            type: 'text',
            content: newPrompt.text,
            isPrivate: newPrompt.isPrivate,
            tags: newPrompt.tags,
            targetAiTools: newPrompt.targetAiTools,
            creationMethod: 'form',
            timeToCreate: Date.now() - (window.promptCreateStartTime || Date.now()),
          });

          // Track content creation funnel - saved
          window.DebugAnalytics.trackContentCreationFunnel({
            step: 'saved',
            stepNumber: 6,
            userId: window.firebaseAuthCurrentUser?.uid || '',
            trigger: 'form_submit',
            timeSpent: Date.now() - (window.promptCreateStartTime || Date.now()),
            draftSaved: false, // No draft needed since it was completed
          });

          // Track activation funnel - major value moment (created first prompt)
          if (window.firebaseAuthCurrentUser) {
            window.DebugAnalytics.trackActivationFunnel({
              step: 'value_moment',
              stepNumber: 4,
              userId: window.firebaseAuthCurrentUser.uid,
              trigger: 'prompt_creation',
              valueMomentsAchieved: ['prompt_created'],
              actionsCompleted: 2,
            });
          }
        }
      }
    } else {
      Utils.handleError('Failed to add prompt. Please check details or try again.', {
        userVisible: true,
      });
    }
  } catch (error) {
    Utils.handleError('Critical error adding prompt: ' + error.message, {
      userVisible: true,
      originalError: error,
    });
  }
}

function getDraftStorage() {
  // Prefer chrome.storage.local, fallback to localStorage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return {
      get: key =>
        new Promise(resolve => {
          chrome.storage.local.get([key], result => resolve(result[key] || null));
        }),
      set: (key, value) =>
        new Promise(resolve => {
          chrome.storage.local.set({ [key]: value }, resolve);
        }),
      remove: key =>
        new Promise(resolve => {
          chrome.storage.local.remove([key], resolve);
        }),
    };
  } else {
    return {
      get: key =>
        Promise.resolve(localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : null),
      set: (key, value) => Promise.resolve(localStorage.setItem(key, JSON.stringify(value))),
      remove: key => Promise.resolve(localStorage.removeItem(key)),
    };
  }
}

function renderPromptEditForm(prompt, draft) {
  // Returns HTML for the edit form fields, using draft if present, else prompt
  const val = (field, fallback = '') =>
    draft && draft[field] !== undefined ? draft[field] : prompt[field] || fallback;
  const tags = Array.isArray(val('tags', [])) ? val('tags', []).join(', ') : val('tags', '');
  const tools = Array.isArray(val('targetAiTools', []))
    ? val('targetAiTools', []).join(', ')
    : val('targetAiTools', '');
  // Use PROMPT_CATEGORIES from window or fallback
  const categories = window.PROMPT_CATEGORIES || [
    'Brainstorming & Idea Generation',
    'Planning & Strategy',
    'Writing & Content Creation',
    'Design & Visual Thinking',
    'Code & Technical Productivity',
    'Research & Analysis',
    'Execution & Delivery',
    'Optimization & Testing',
    'Decision-Making & Clarity',
    'Personal Productivity & Focus',
    'Workshop & Meeting Support',
    'Client Communication & Sales',
    'Team Collaboration & Alignment',
    'Professional Development',
    'Creative Projects & Hobbies',
    'Life Admin & Personal Insight',
  ];
  return `
    <form id="prompt-edit-form" autocomplete="off" novalidate>
      <div class="form-group">
        <label for="edit-title">${getText('TITLE_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="edit-title" name="title" required maxlength="100" rows="2" aria-required="true">${Utils.escapeHTML(val('title'))}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-description">${getText('DESCRIPTION_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="edit-description" name="description" required maxlength="500" aria-required="true">${Utils.escapeHTML(val('description'))}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-text">${getText('PROMPT_TEXT_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <textarea id="edit-text" name="text" required aria-required="true">${Utils.escapeHTML(val('text'))}</textarea>
      </div>
      <div class="form-group">
        <label for="edit-category">${getText('CATEGORY_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <select id="edit-category" name="category" required aria-required="true">
          <option value="">${getText('SELECT_CATEGORY')}</option>
          ${categories.map(cat => `<option value="${Utils.escapeHTML(cat)}"${val('category') === cat ? ' selected' : ''}>${Utils.escapeHTML(cat)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="edit-tags">${getText('TAGS_LABEL')}:</label>
        <input type="text" id="edit-tags" name="tags" value="${Utils.escapeHTML(tags)}" />
      </div>
      <div class="form-group">
        <label for="edit-tools">${getText('TARGET_AI_TOOLS_LABEL')}: <span class="required" aria-hidden="true">*</span></label>
        <input type="text" id="edit-tools" name="targetAiTools" required aria-required="true" value="${Utils.escapeHTML(tools)}" />
      </div>
      <div class="form-group">
        <input type="checkbox" id="edit-private" name="isPrivate"${val('isPrivate') ? ' checked' : ''} />
        <label for="edit-private">${getText('MAKE_PRIVATE_LABEL')}</label>
      </div>
    </form>
  `;
}

function showEditMode(prompt) {
  if (!promptDetailsSectionEl) return;

  // Track prompt edit start time for analytics
  window.promptEditStartTime = Date.now();
  if (!promptDetailEditableFieldsWrapperEl)
    promptDetailEditableFieldsWrapperEl = document.getElementById(
      'prompt-detail-editable-fields-wrapper'
    );
  if (!promptDetailStaticFieldsWrapperEl)
    promptDetailStaticFieldsWrapperEl = document.getElementById(
      'prompt-detail-static-fields-wrapper'
    );
  if (!promptEditActionsBarEl)
    promptEditActionsBarEl = document.getElementById('prompt-edit-actions-bar');
  if (!promptOwnerActionsBarEl)
    promptOwnerActionsBarEl = document.getElementById('prompt-owner-actions-bar');
  const draftStorage = getDraftStorage();
  const promptId = prompt.id;
  draftStorage.get(editDraftKey(promptId)).then(draft => {
    promptDetailEditableFieldsWrapperEl.innerHTML = renderPromptEditForm(prompt, draft);
    promptDetailEditableFieldsWrapperEl.classList.remove('hidden');
    promptDetailStaticFieldsWrapperEl.classList.add('hidden');

    // Show edit buttons and hide add buttons
    if (promptEditActionsBarEl) {
      console.log('Showing edit actions bar:', promptEditActionsBarEl);
      promptEditActionsBarEl.classList.remove('hidden');
      promptEditActionsBarEl.style.display = 'flex'; // Force display flex

      const editButtons = document.getElementById('edit-prompt-buttons');
      const addButtons = document.getElementById('add-prompt-buttons');

      if (editButtons) {
        console.log('Found edit buttons, showing:', editButtons);
        editButtons.classList.remove('hidden');
        editButtons.style.display = 'flex'; // Force display flex
      }

      if (addButtons) {
        console.log('Found add buttons, hiding:', addButtons);
        addButtons.classList.add('hidden');
      }
    }

    if (promptOwnerActionsBarEl) promptOwnerActionsBarEl.classList.add('hidden');

    // Add editing-prompt class but ensure adding-prompt class is removed
    // This ensures we're in edit mode but not add mode
    document.body.classList.add('editing-prompt');
    document.body.classList.remove('adding-prompt');

    // Add editing class to prompt details section for specific styling
    if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('editing');

    // Hide category dropdown bar in edit mode
    const categoryDropdownBar = document.querySelector('.category-dropdown-bar');
    if (categoryDropdownBar) categoryDropdownBar.classList.add('hidden');

    // Hide additional elements in edit mode
    // 1. Prompt title and actions (copy, favorite)
    const promptHeader = document.querySelector('.prompt-item__header');
    if (promptHeader) promptHeader.classList.add('hidden');

    // Add a heading to indicate edit mode
    const editHeading = document.createElement('div');
    editHeading.id = 'edit-mode-heading';
    editHeading.classList.add('edit-mode-heading');
    editHeading.innerHTML = `<h2>${getText('EDITING_PROMPT')}</h2>`;
    if (promptDetailEditableFieldsWrapperEl) {
      promptDetailEditableFieldsWrapperEl.insertAdjacentElement('beforebegin', editHeading);
    }

    // 2. Prompt category and tags
    const promptCategory = document.getElementById('prompt-detail-category');
    if (promptCategory) promptCategory.classList.add('hidden');

    const promptTags = document.getElementById('prompt-detail-tags');
    if (promptTags) promptTags.classList.add('hidden');

    // 3. Back to list button
    const backToListButton = document.getElementById('back-to-list-button');
    if (backToListButton) backToListButton.classList.add('hidden');

    // Hide ratings when editing
    if (userStarRatingEl && userStarRatingEl.parentElement) {
      userStarRatingEl.parentElement.classList.add('hidden');
    }
    if (communityRatingSectionEl) {
      communityRatingSectionEl.classList.add('hidden');
    }

    // Set up input listeners for draft persistence
    const form = document.getElementById('prompt-edit-form');
    if (form) {
      form.addEventListener('input', () => {
        const data = getEditFormData();
        draftStorage.set(editDraftKey(promptId), data);
      });
      // Wire up Cancel button after rendering the form
      const cancelEditBtn = document.getElementById('cancel-edit-prompt-button');
      if (cancelEditBtn) {
        cancelEditBtn.onclick = () => handleCancelEditPrompt(prompt);
      }
    }
  });
}

function getEditFormData() {
  const form = document.getElementById('prompt-edit-form');
  if (!form) return {};
  return {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    text: form.text.value.trim(),
    category: form.category.value,
    tags: form.tags.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean),
    targetAiTools: form.targetAiTools.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean),
    isPrivate: form.isPrivate.checked,
  };
}

async function handleSaveEditPrompt(prompt) {
  const form = document.getElementById('prompt-edit-form');
  if (!form) return;
  const data = getEditFormData();
  // Validate required fields and show inline, accessible error message
  const requiredFields = [
    { id: 'edit-title', name: 'Title' },
    { id: 'edit-description', name: 'Description' },
    { id: 'edit-text', name: 'Prompt Text' },
    { id: 'edit-category', name: 'Category' },
    { id: 'edit-tools', name: 'Target AI Tools' },
  ];
  let firstInvalid = null;
  let missingFields = [];
  requiredFields.forEach(field => {
    const el = document.getElementById(field.id);
    let value = el?.value?.trim() || '';
    if (field.id === 'edit-category' && value === '') value = '';
    if (
      field.id === 'edit-tools' &&
      value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean).length === 0
    ) {
      value = '';
    }
    if (!value) {
      missingFields.push(field.name);
      if (!firstInvalid) firstInvalid = el;
      if (el) {
        el.setAttribute('aria-invalid', 'true');
        el.classList.add('input-error');
      }
    } else if (el) {
      el.removeAttribute('aria-invalid');
      el.classList.remove('input-error');
    }
  });
  // Show error using the global message system
  if (missingFields.length > 0) {
    Utils.handleError(
      textManager.format('REQUIRED_FIELDS_ERROR', { fields: missingFields.join(', ') }),
      {
        userVisible: true,
        type: 'error',
        timeout: 5000,
        specificErrorElement: null,
      }
    );
    if (firstInvalid && typeof firstInvalid.focus === 'function') firstInvalid.focus();
    return;
  }
  try {
    const updatedPrompt = await PromptData.updatePrompt(prompt.id, data);
    if (updatedPrompt && updatedPrompt.id) {
      // Clear draft
      await getDraftStorage().remove(editDraftKey(prompt.id));
      Utils.showConfirmationMessage(getText('PROMPT_UPDATED_SUCCESS'));
      displayPromptDetails(updatedPrompt);

      // Track content selection for edit action
      if (window.DebugAnalytics) {
        window.DebugAnalytics.trackContentSelection({
          contentType: 'prompt',
          contentId: updatedPrompt.id,
          promptId: updatedPrompt.id,
          promptCategory: updatedPrompt.category || 'unknown',
          source: 'prompt_details',
          method: 'edit',
          userRating: updatedPrompt.currentUserRating || 0,
          isFavorite: updatedPrompt.currentUserIsFavorite || false,
        });

        // Track custom prompt edit event
        const originalPrompt = allPrompts.find(p => p.id === prompt.id);
        window.DebugAnalytics.trackPromptEdit({
          id: updatedPrompt.id,
          category: updatedPrompt.category,
          type: 'text',
          changesMade: [], // Could be enhanced to track specific field changes
          contentLengthBefore: originalPrompt?.text?.length || 0,
          contentLengthAfter: updatedPrompt.text?.length || 0,
          editDuration: Date.now() - (window.promptEditStartTime || Date.now()),
          version: 1,
        });
      }
    } else {
      Utils.handleError('Failed to update prompt. Please check details or try again.', {
        userVisible: true,
      });
    }
  } catch (error) {
    Utils.handleError('Critical error updating prompt: ' + error.message, {
      userVisible: true,
      originalError: error,
    });
  }
}

// --- Category dropdown sync helpers ---
function syncCategoryDropdowns(source) {
  if (!mainCategoryDropdownEl || !categoryFilterEl) return;
  if (source === 'main') {
    categoryFilterEl.value = mainCategoryDropdownEl.value;
  } else {
    mainCategoryDropdownEl.value = categoryFilterEl.value;
  }
}
// Main category dropdown DOM element
let mainCategoryDropdownEl;
/**
 * PromptFinder Extension - UI Controllers
 * Contains functions for managing the UI and interactions.
 */

import * as Utils from './utils.js';
import * as PromptData from './promptData.js';
import { auth } from './firebase-init.js'; // Import the initialized auth service
import { PROMPT_CATEGORIES } from './categories.js';
import { getText, textManager } from './text-constants.js';
import { handleConnectionError } from './firebase-connection-handler.js';

// Import Prism.js
import './vendor/prism.js'; // Core
import './vendor/prism-markdown.min.js'; // Markdown language support

let allPrompts = [];
let activeTab = 'all';

const PROMPT_TRUNCATE_LENGTH = 200;

// Cached DOM Elements (module scope)
let tabAllEl, tabFavsEl, tabPrivateEl;
let searchInputEl;
let filterButtonEl,
  ratingFilterPanelEl,
  minRatingSelectEl,
  minUserRatingSelectEl,
  yourPromptsOnlyEl,
  usedByYouEl,
  categoryFilterEl,
  tagFilterEl,
  aiToolFilterEl,
  dateFromEl,
  dateToEl,
  updatedFromEl,
  updatedToEl;
let promptsListEl;
let promptDetailsSectionEl,
  backToListButtonEl,
  copyPromptDetailButtonEl,
  editPromptButtonEl,
  deletePromptTriggerButtonEl,
  promptOwnerActionsEl,
  deleteConfirmationEl,
  cancelDeleteButtonEl,
  confirmDeleteButtonEl,
  promptDetailTitleEl,
  promptDetailDescriptionEl,
  promptDetailTextEl,
  promptTextWrapperEl,
  promptTextViewMoreEl,
  promptDetailCategoryEl,
  promptDetailTagsEl,
  promptDetailToolsEl,
  promptDetailAuthorEl,
  promptDetailCreatedEl,
  promptDetailUpdatedEl,
  promptDetailUsageEl,
  promptDetailFavoritesEl,
  userStarRatingEl,
  userRatingMessageEl,
  communityRatingSectionEl,
  communityStarDisplayEl,
  communityAverageRatingValueEl,
  communityRatingCountEl;

let controlsEl, tabsContainerEl, addPromptBarEl;
let addPromptFabEl;
let resetFiltersButtonEl;

// Sort panel DOM elements and state
let sortPanelEl, sortBySelectEl, sortDirToggleEl, sortDirIconEl;
let currentSortBy = 'createdAt';
let currentSortDir = 'desc';

export const cacheDOMElements = () => {
  mainCategoryDropdownEl = document.getElementById('main-category-dropdown');
  resetFiltersButtonEl = document.getElementById('reset-filters-button');
  sortPanelEl = document.getElementById('sort-panel');
  sortBySelectEl = document.getElementById('sort-by');
  sortDirToggleEl = document.getElementById('sort-dir-toggle');
  sortDirIconEl = document.getElementById('sort-dir-icon');

  // Populate sort dropdown with i18n text constants
  if (sortBySelectEl) {
    const sortOptions = [
      { value: 'createdAt', label: getText('SORT_NEWEST') },
      { value: 'updatedAt', label: getText('SORT_RECENTLY_EDITED') },
      { value: 'averageRating', label: getText('SORT_COMMUNITY_RATING') },
      { value: 'currentUserRating', label: getText('SORT_YOUR_RATING') },
      { value: 'usageCount', label: getText('SORT_MOST_USED') },
      { value: 'favoritesCount', label: getText('SORT_MOST_FAVORITED') },
      { value: 'title', label: getText('SORT_TITLE_AZ') },
    ];
    sortBySelectEl.innerHTML = sortOptions
      .map(opt => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');
  }
  tabAllEl = document.getElementById('tab-all');
  tabFavsEl = document.getElementById('tab-favs');
  tabPrivateEl = document.getElementById('tab-private');
  // Link tab panels for accessibility
  const panelAll = document.getElementById('panel-all');
  const panelFavs = document.getElementById('panel-favs');
  const panelPrivate = document.getElementById('panel-private');
  if (panelAll && tabAllEl) panelAll.hidden = !(tabAllEl.getAttribute('aria-selected') === 'true');
  if (panelFavs && tabFavsEl)
    panelFavs.hidden = !(tabFavsEl.getAttribute('aria-selected') === 'true');
  if (panelPrivate && tabPrivateEl)
    panelPrivate.hidden = !(tabPrivateEl.getAttribute('aria-selected') === 'true');
  searchInputEl = document.getElementById('search-input');
  filterButtonEl = document.getElementById('filter-button');
  ratingFilterPanelEl = document.getElementById('rating-filter');
  minRatingSelectEl = document.getElementById('min-rating');
  minUserRatingSelectEl = document.getElementById('min-user-rating');
  yourPromptsOnlyEl = document.getElementById('your-prompts-only');
  usedByYouEl = document.getElementById('used-by-you');
  categoryFilterEl = document.getElementById('category-filter');
  tagFilterEl = document.getElementById('tag-filter');
  aiToolFilterEl = document.getElementById('ai-tool-filter');
  dateFromEl = document.getElementById('date-from');
  dateToEl = document.getElementById('date-to');
  updatedFromEl = document.getElementById('updated-from');
  updatedToEl = document.getElementById('updated-to');
  promptsListEl = document.getElementById('scrollable-main');
  promptDetailsSectionEl = document.getElementById('prompt-details-section');

  promptDetailTitleEl = document.getElementById('prompt-detail-title');
  promptDetailDescriptionEl = document.getElementById('prompt-detail-description');
  promptDetailTextEl = document.getElementById('prompt-detail-text');
  promptTextWrapperEl = document.getElementById('prompt-text-wrapper')?.querySelector('pre');
  promptTextViewMoreEl = document.getElementById('prompt-text-view-more');

  promptDetailCategoryEl = document.getElementById('prompt-detail-category');
  promptDetailTagsEl = document.getElementById('prompt-detail-tags');
  promptDetailToolsEl = document.getElementById('prompt-detail-tools');
  promptDetailAuthorEl = document.getElementById('prompt-detail-author');
  promptDetailCreatedEl = document.getElementById('prompt-detail-created');
  promptDetailUpdatedEl = document.getElementById('prompt-detail-updated');
  promptDetailUsageEl = document.getElementById('prompt-detail-usage');
  promptDetailFavoritesEl = document.getElementById('prompt-detail-favorites');

  userStarRatingEl = document.getElementById('user-star-rating');
  userRatingMessageEl = document.getElementById('user-rating-message');
  communityRatingSectionEl = document.getElementById('community-rating-section');
  communityStarDisplayEl = document.getElementById('community-star-display');
  communityAverageRatingValueEl = document.getElementById('community-average-rating-value');
  communityRatingCountEl = document.getElementById('community-rating-count');

  promptOwnerActionsEl = document.querySelector('.prompt-owner-actions');
  if (promptOwnerActionsEl) {
    editPromptButtonEl = promptOwnerActionsEl.querySelector('#edit-prompt-button');
    deletePromptTriggerButtonEl = promptOwnerActionsEl.querySelector(
      '#delete-prompt-detail-trigger-button'
    );
  }

  if (!editPromptButtonEl) editPromptButtonEl = document.getElementById('edit-prompt-button');
  if (!deletePromptTriggerButtonEl)
    deletePromptTriggerButtonEl = document.getElementById('delete-prompt-detail-trigger-button');

  if (promptDetailsSectionEl) {
    backToListButtonEl = promptDetailsSectionEl.querySelector('#back-to-list-button');
    copyPromptDetailButtonEl = promptDetailsSectionEl.querySelector('#copy-prompt-button');
    deleteConfirmationEl = promptDetailsSectionEl.querySelector('#delete-confirmation');
    cancelDeleteButtonEl = promptDetailsSectionEl.querySelector('#cancel-delete-button');
    confirmDeleteButtonEl = promptDetailsSectionEl.querySelector('#confirm-delete-button');
  }
  controlsEl = document.querySelector('.controls');
  tabsContainerEl = document.querySelector('.tabs');
  addPromptBarEl = document.querySelector('.add-prompt-bar');
  addPromptFabEl = document.getElementById('add-prompt-fab');
};

export const openDetachedAddPromptWindow = () => {
  // Instead of opening a detached window, we now show the add form inline
  // First switch to the details view with proper setup
  showPromptDetailsView();
  // Then show add prompt interface
  showAddPromptInline();
};

async function handlePromptListClick(event) {
  console.log('[UI SUT LOG] handlePromptListClick triggered');
  // Prevent card click from opening details if copy or favorite button is clicked
  const copyBtn = event.target.closest('.copy-prompt');
  const favBtn = event.target.closest('.toggle-favorite');
  if (copyBtn) {
    event.stopPropagation();
    const promptId = copyBtn.dataset.id;
    if (promptId) await handleCopyPrompt(promptId);
    return;
  }
  if (favBtn) {
    event.stopPropagation();
    const promptId = favBtn.dataset.id;
    if (promptId) await handleToggleFavorite(promptId);
    return;
  }
  // Card click: open details
  const cardBtn = event.target.closest('.prompt-card-btn');
  if (cardBtn && cardBtn.dataset.id) {
    await viewPromptDetails(cardBtn.dataset.id);
  }
}

async function handleToggleFavorite(promptId) {
  const currentUser = auth ? auth.currentUser : null;
  if (!currentUser) {
    if (window.handleAuthRequiredAction) {
      window.handleAuthRequiredAction('favorite a prompt');
    } else {
      Utils.handleError('Please login or create an account to favorite a prompt.', {
        specificErrorElement: document.getElementById('error-message'),
        type: 'info',
        timeout: 5000,
      });
    }
    return;
  }
  try {
    const updatedPrompt = await PromptData.toggleFavorite(promptId);
    if (updatedPrompt) {
      // After toggling favorite, reload all prompts to ensure counts are up to date
      allPrompts = await PromptData.loadPrompts();
      if (
        promptDetailsSectionEl &&
        !promptDetailsSectionEl.classList.contains('hidden') &&
        promptDetailsSectionEl.dataset.currentPromptId === promptId
      ) {
        // Find the updated prompt from the new allPrompts array
        const freshPrompt = allPrompts.find(p => p.id === promptId) || updatedPrompt;
        displayPromptDetails(freshPrompt);
      }
      // Always re-render the list to update favorite count, but preserve scroll position
      const scrollElem = document.getElementById('scrollable-main');
      const prevScrollTop = scrollElem ? scrollElem.scrollTop : 0;
      showTab(activeTab, { preserveScrollTop: prevScrollTop });
      Utils.showConfirmationMessage(getText('FAVORITE_UPDATED'));

      // Track content selection for favorite action
      if (window.DebugAnalytics) {
        window.DebugAnalytics.trackContentSelection({
          contentType: 'prompt',
          contentId: updatedPrompt.id,
          promptId: updatedPrompt.id,
          promptCategory: updatedPrompt.category || 'unknown',
          source:
            promptDetailsSectionEl && !promptDetailsSectionEl.classList.contains('hidden')
              ? 'prompt_details'
              : 'prompt_list',
          method: updatedPrompt.currentUserIsFavorite ? 'favorite_add' : 'favorite_remove',
          userRating: updatedPrompt.currentUserRating || 0,
          isFavorite: updatedPrompt.currentUserIsFavorite || false,
        });

        // Track custom favorite action event
        window.DebugAnalytics.trackFavoriteAction({
          promptId: updatedPrompt.id,
          action: updatedPrompt.currentUserIsFavorite ? 'add' : 'remove',
          category: updatedPrompt.category,
          totalFavorites: updatedPrompt.favoritesCount,
        });

        // Track prompt engagement funnel - favorited
        window.DebugAnalytics.trackPromptEngagementFunnel({
          step: 'favorited',
          stepNumber: 4,
          promptId: updatedPrompt.id,
          promptCategory: updatedPrompt.category || 'unknown',
          isFavorite: updatedPrompt.currentUserIsFavorite || false,
          userRating: updatedPrompt.currentUserRating || 0,
          engagementDepth: 'deep',
        });

        // Track activation funnel - value moment (successful favorite)
        if (window.firebaseAuthCurrentUser) {
          window.DebugAnalytics.trackActivationFunnel({
            step: 'value_moment',
            stepNumber: 3,
            userId: window.firebaseAuthCurrentUser.uid,
            trigger: 'prompt_favorite',
            valueMomentsAchieved: ['prompt_favorited'],
            actionsCompleted: 1,
          });
        }
      }
    }
  } catch (error) {
    Utils.handleError('Error toggling favorite status in UI', {
      userVisible: true,
      originalError: error,
    });
  }
}

async function handleRatePrompt(promptId, rating) {
  try {
    const updatedPromptWithNewRating = await PromptData.ratePrompt(promptId, rating);
    if (updatedPromptWithNewRating) {
      const index = allPrompts.findIndex(p => p.id === promptId);
      if (index !== -1) {
        allPrompts[index] = updatedPromptWithNewRating;
      }
      if (
        promptDetailsSectionEl &&
        !promptDetailsSectionEl.classList.contains('hidden') &&
        promptDetailsSectionEl.dataset.currentPromptId === promptId
      ) {
        displayPromptDetails(updatedPromptWithNewRating);
      }
      Utils.showConfirmationMessage(textManager.format('RATING_SUCCESS', { rating }));

      // Track content selection for rating action
      if (window.DebugAnalytics) {
        window.DebugAnalytics.trackContentSelection({
          contentType: 'prompt',
          contentId: updatedPromptWithNewRating.id,
          promptId: updatedPromptWithNewRating.id,
          promptCategory: updatedPromptWithNewRating.category || 'unknown',
          source:
            promptDetailsSectionEl && !promptDetailsSectionEl.classList.contains('hidden')
              ? 'prompt_details'
              : 'prompt_list',
          method: 'rating',
          userRating: rating,
          isFavorite: updatedPromptWithNewRating.currentUserIsFavorite || false,
        });

        // Track custom rating action event
        const currentPrompt = allPrompts.find(p => p.id === promptId);
        window.DebugAnalytics.trackRatingAction({
          promptId: updatedPromptWithNewRating.id,
          rating: rating,
          previousRating: currentPrompt?.currentUserRating || 0,
          category: updatedPromptWithNewRating.category,
        });
      }
    } else {
      Utils.handleError('Failed to submit rating. Please try again.', { userVisible: true });
    }
  } catch (error) {
    Utils.handleError('Error processing rating in UI', { userVisible: true, originalError: error });
  }
}

async function handleCopyPrompt(promptId) {
  try {
    const result = await PromptData.copyPromptToClipboard(promptId);
    if (result.success) {
      Utils.showConfirmationMessage(getText('COPY_SUCCESS'));

      if (result.prompt) {
        // Update the prompt in the list of all prompts
        const index = allPrompts.findIndex(p => p.id === promptId);
        if (index !== -1) {
          allPrompts[index] = result.prompt;
        }

        // If we're viewing the details, update the details view
        if (
          promptDetailsSectionEl &&
          !promptDetailsSectionEl.classList.contains('hidden') &&
          promptDetailsSectionEl.dataset.currentPromptId === promptId
        ) {
          displayPromptDetails(result.prompt);
        }

        // Track content selection for copy action
        if (window.DebugAnalytics) {
          window.DebugAnalytics.trackContentSelection({
            contentType: 'prompt',
            contentId: result.prompt.id,
            promptId: result.prompt.id,
            promptCategory: result.prompt.category || 'unknown',
            source:
              promptDetailsSectionEl && !promptDetailsSectionEl.classList.contains('hidden')
                ? 'prompt_details'
                : 'prompt_list',
            method: 'copy',
            userRating: result.prompt.currentUserRating || 0,
            isFavorite: result.prompt.currentUserIsFavorite || false,
          });

          // Track custom prompt copy event
          window.DebugAnalytics.trackPromptCopy({
            id: result.prompt.id,
            category: result.prompt.category,
            copyMethod: 'button',
            content: result.prompt.text,
            isFavorite: result.prompt.currentUserIsFavorite,
          });

          // Track prompt engagement funnel - copied
          window.DebugAnalytics.trackPromptEngagementFunnel({
            step: 'copied',
            stepNumber: 3,
            promptId: result.prompt.id,
            promptCategory: result.prompt.category || 'unknown',
            promptLength: result.prompt.text?.length || 0,
            isFavorite: result.prompt.currentUserIsFavorite || false,
            userRating: result.prompt.currentUserRating || 0,
            engagementDepth: 'deep',
          });

          // Track activation funnel - value moment (successful prompt copy)
          if (window.firebaseAuthCurrentUser) {
            window.DebugAnalytics.trackActivationFunnel({
              step: 'value_moment',
              stepNumber: 3,
              userId: window.firebaseAuthCurrentUser.uid,
              trigger: 'prompt_copy',
              valueMomentsAchieved: ['prompt_copied'],
              actionsCompleted: 1,
            });
          }
        }
      }
    } else {
      // Only show an error if clipboard write failed or prompt not found
      Utils.handleError(getText('COPY_FAILED'), {
        userVisible: true,
        type: 'error',
      });
    }
  } catch (error) {
    // Don't show errors related to authentication for copy actions
    if (
      error &&
      error.message &&
      (error.message.includes('must be logged in') ||
        error.message.includes('not authorized') ||
        error.message.includes('PERMISSION_DENIED') ||
        error.message.includes('unauth') ||
        error.message.includes('401'))
    ) {
      // For auth-related errors, silently proceed with copy without showing error
      console.info(
        'Auth-related warning during copy (expected for logged-out users):',
        error.message
      );
      // Still show success message since the copy itself succeeded
      Utils.showConfirmationMessage(getText('COPY_SUCCESS'));
    } else {
      // Show errors for non-auth related issues
      Utils.handleError('Failed to process copy action in UI', {
        userVisible: true,
        originalError: error,
      });
    }
  }
}

async function handleDeletePrompt(promptId) {
  try {
    // Get prompt details before deleting for analytics
    const promptBeforeDelete = allPrompts.find(p => p.id === promptId);

    const success = await PromptData.deletePrompt(promptId);
    if (success) {
      Utils.showConfirmationMessage(getText('PROMPT_DELETED_SUCCESS'));

      // Track content selection for delete action
      if (window.DebugAnalytics && promptBeforeDelete) {
        window.DebugAnalytics.trackContentSelection({
          contentType: 'prompt',
          contentId: promptBeforeDelete.id,
          promptId: promptBeforeDelete.id,
          promptCategory: promptBeforeDelete.category || 'unknown',
          source: 'prompt_details',
          method: 'delete',
          userRating: promptBeforeDelete.currentUserRating || 0,
          isFavorite: promptBeforeDelete.currentUserIsFavorite || false,
        });

        // Track custom prompt delete event
        const promptAge = promptBeforeDelete.createdAt
          ? Math.floor(
              (Date.now() - new Date(promptBeforeDelete.createdAt).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0;
        window.DebugAnalytics.trackPromptDelete({
          id: promptBeforeDelete.id,
          category: promptBeforeDelete.category,
          ageDays: promptAge,
          usageCount: promptBeforeDelete.usageCount || 0,
          favoritesCount: promptBeforeDelete.favoritesCount || 0,
          userRating: promptBeforeDelete.currentUserRating || 0,
          deleteReason: 'user_choice',
          contentLength: promptBeforeDelete.text?.length || 0,
        });
      }

      await loadAndDisplayData();
      showPromptList();
    }
  } catch (error) {
    Utils.handleError('Error during prompt deletion process', {
      userVisible: true,
      originalError: error,
    });
  }
}

function updateResetFiltersButtonVisibility() {
  if (!resetFiltersButtonEl) return;
  const filtersActive =
    (minRatingSelectEl && minRatingSelectEl.value !== '0') ||
    (minUserRatingSelectEl && minUserRatingSelectEl.value !== '0') ||
    (yourPromptsOnlyEl && yourPromptsOnlyEl.checked) ||
    (usedByYouEl && usedByYouEl.checked) ||
    (categoryFilterEl && categoryFilterEl.value) ||
    (tagFilterEl && tagFilterEl.value) ||
    (aiToolFilterEl && aiToolFilterEl.value) ||
    (dateFromEl && dateFromEl.value) ||
    (dateToEl && dateToEl.value) ||
    (updatedFromEl && updatedFromEl.value) ||
    (updatedToEl && updatedToEl.value);
  if (filtersActive) {
    resetFiltersButtonEl.classList.remove('hidden');
  } else {
    resetFiltersButtonEl.classList.add('hidden');
  }
}

const setupEventListeners = () => {
  // Main always-visible category dropdown
  if (mainCategoryDropdownEl) {
    mainCategoryDropdownEl.addEventListener('change', () => {
      syncCategoryDropdowns('main');
      showTab(activeTab);
      updateResetFiltersButtonVisibility();
    });
  }
  // Keep filter panel category select in sync
  if (categoryFilterEl) {
    categoryFilterEl.addEventListener('change', () => {
      syncCategoryDropdowns('filter');
      showTab(activeTab);
      updateResetFiltersButtonVisibility();
    });
  }
  // Floating Action Button (FAB) for Add New Prompt
  if (addPromptFabEl) {
    addPromptFabEl.addEventListener('click', openDetachedAddPromptWindow);
  }
  // Reset Filters button logic
  if (resetFiltersButtonEl) {
    resetFiltersButtonEl.addEventListener('click', () => {
      // Reset all filter controls to default
      if (minRatingSelectEl) minRatingSelectEl.value = '0';
      if (minUserRatingSelectEl) minUserRatingSelectEl.value = '0';
      if (yourPromptsOnlyEl) yourPromptsOnlyEl.checked = false;
      if (usedByYouEl) usedByYouEl.checked = false;
      if (categoryFilterEl) categoryFilterEl.value = '';
      if (tagFilterEl) tagFilterEl.value = '';
      if (aiToolFilterEl) aiToolFilterEl.value = '';
      if (dateFromEl) dateFromEl.value = '';
      if (dateToEl) dateToEl.value = '';
      if (updatedFromEl) updatedFromEl.value = '';
      if (updatedToEl) updatedToEl.value = '';
      showTab(activeTab);
      updateResetFiltersButtonVisibility();
    });
  }
  // Sort panel show/hide
  const sortButtonEl = document.getElementById('sort-button');
  if (sortButtonEl && sortPanelEl) {
    sortButtonEl.addEventListener('click', () => {
      sortPanelEl.classList.toggle('hidden');
      sortButtonEl.classList.toggle('active');
    });
  }

  // Sort select and direction toggle
  if (sortBySelectEl) {
    sortBySelectEl.addEventListener('change', () => {
      currentSortBy = sortBySelectEl.value;

      // Track sort usage
      if (window.DebugAnalytics) {
        window.DebugAnalytics.trackCustomEvent('sort_usage', {
          sort_by: currentSortBy,
          sort_dir: currentSortDir,
          context: 'popup',
        });
      }

      showTab(activeTab);
    });
  }
  if (sortDirToggleEl && sortDirIconEl) {
    sortDirToggleEl.addEventListener('click', () => {
      currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';

      // Track sort direction change
      if (window.DebugAnalytics) {
        window.DebugAnalytics.trackCustomEvent('sort_direction_change', {
          sort_by: currentSortBy,
          sort_dir: currentSortDir,
          context: 'popup',
        });
      }

      // Update icon
      sortDirIconEl.className =
        currentSortDir === 'asc' ? 'fas fa-arrow-up-wide-short' : 'fas fa-arrow-down-wide-short';
      showTab(activeTab);
    });
  }
  const setTabSelection = activeId => {
    const tabs = [tabAllEl, tabFavsEl, tabPrivateEl];
    const panels = {
      all: document.getElementById('panel-all'),
      favs: document.getElementById('panel-favs'),
      private: document.getElementById('panel-private'),
    };
    tabs.forEach(btn => {
      if (!btn) return;
      const isActive = btn.id === activeId;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
    });
    if (panels.all) panels.all.hidden = activeId !== 'tab-all';
    if (panels.favs) panels.favs.hidden = activeId !== 'tab-favs';
    if (panels.private) panels.private.hidden = activeId !== 'tab-private';
  };

  tabAllEl?.addEventListener('click', () => {
    setTabSelection('tab-all');
    showTab('all');
  });
  tabFavsEl?.addEventListener('click', () => {
    setTabSelection('tab-favs');
    showTab('favs');
  });
  tabPrivateEl?.addEventListener('click', () => {
    setTabSelection('tab-private');
    showTab('private');
  });
  searchInputEl?.addEventListener('input', () => showTab(activeTab));

  if (filterButtonEl && ratingFilterPanelEl) {
    filterButtonEl.addEventListener('click', () => {
      ratingFilterPanelEl.classList.toggle('hidden');
      filterButtonEl.classList.toggle('active');
    });
  }
  minRatingSelectEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && minRatingSelectEl.value > 0) {
      window.DebugAnalytics.trackFilterUsage({
        type: 'min_rating',
        value: minRatingSelectEl.value,
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  minUserRatingSelectEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && minUserRatingSelectEl.value > 0) {
      window.DebugAnalytics.trackFilterUsage({
        type: 'min_user_rating',
        value: minUserRatingSelectEl.value,
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  yourPromptsOnlyEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && yourPromptsOnlyEl.checked) {
      window.DebugAnalytics.trackFilterUsage({
        type: 'your_prompts_only',
        value: 'enabled',
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  usedByYouEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && usedByYouEl.checked) {
      window.DebugAnalytics.trackFilterUsage({
        type: 'used_by_you',
        value: 'enabled',
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  categoryFilterEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && categoryFilterEl.value && categoryFilterEl.value !== 'all') {
      window.DebugAnalytics.trackFilterUsage({
        type: 'category',
        value: categoryFilterEl.value,
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  tagFilterEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && tagFilterEl.value && tagFilterEl.value !== 'all') {
      window.DebugAnalytics.trackFilterUsage({
        type: 'tag',
        value: tagFilterEl.value,
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  aiToolFilterEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && aiToolFilterEl.value && aiToolFilterEl.value !== 'all') {
      window.DebugAnalytics.trackFilterUsage({
        type: 'ai_tool',
        value: aiToolFilterEl.value,
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  dateFromEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && dateFromEl.value) {
      window.DebugAnalytics.trackFilterUsage({
        type: 'date_from',
        value: dateFromEl.value,
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  dateToEl?.addEventListener('change', () => {
    // Track filter usage
    if (window.DebugAnalytics && dateToEl.value) {
      window.DebugAnalytics.trackFilterUsage({
        type: 'date_to',
        value: dateToEl.value,
        context: 'popup',
      });
    }
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  updatedFromEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });
  updatedToEl?.addEventListener('change', () => {
    showTab(activeTab);
    updateResetFiltersButtonVisibility();
  });

  promptsListEl?.addEventListener('click', handlePromptListClick);

  if (promptDetailsSectionEl) {
    backToListButtonEl?.addEventListener('click', () => showPromptList());
    copyPromptDetailButtonEl?.addEventListener('click', () => {
      const promptId =
        promptDetailsSectionEl.dataset.currentPromptId ||
        (userStarRatingEl ? userStarRatingEl.dataset.id : null);
      if (promptId) handleCopyPrompt(promptId);
    });
    editPromptButtonEl?.addEventListener('click', async () => {
      const promptId =
        promptDetailsSectionEl.dataset.currentPromptId ||
        (userStarRatingEl ? userStarRatingEl.dataset.id : null);
      if (promptId && editPromptButtonEl && !editPromptButtonEl.disabled) {
        // In-place edit mode
        const prompt = await PromptData.findPromptById(promptId);
        if (prompt) showEditMode(prompt);
      }
    });
    // Save/cancel handlers for in-place edit
    const saveEditBtn = document.getElementById('save-edit-prompt-button');
    const cancelEditBtn = document.getElementById('cancel-edit-prompt-button');
    if (saveEditBtn) {
      saveEditBtn.onclick = async () => {
        const promptId = promptDetailsSectionEl.dataset.currentPromptId;
        const prompt = await PromptData.findPromptById(promptId);
        if (prompt) handleSaveEditPrompt(prompt);
      };
    }
    if (cancelEditBtn) {
      cancelEditBtn.onclick = async () => {
        const promptId = promptDetailsSectionEl.dataset.currentPromptId;
        const prompt = await PromptData.findPromptById(promptId);
        if (prompt) {
          // Ensure the function is in scope and defined
          if (typeof handleCancelEditPrompt === 'function') {
            handleCancelEditPrompt(prompt);
          } else if (window.handleCancelEditPrompt) {
            window.handleCancelEditPrompt(prompt);
          } else {
            // fallback: just redisplay details
            displayPromptDetails(prompt);
          }
        }
      };
    }
    deletePromptTriggerButtonEl?.addEventListener('click', () => {
      if (deletePromptTriggerButtonEl && !deletePromptTriggerButtonEl.disabled) {
        if (deleteConfirmationEl) deleteConfirmationEl.classList.remove('hidden');
      }
    });
    cancelDeleteButtonEl?.addEventListener('click', () => {
      if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
    });
    confirmDeleteButtonEl?.addEventListener('click', () => {
      const currentDetailedPromptId = promptDetailsSectionEl.dataset.currentPromptId;
      if (currentDetailedPromptId) {
        handleDeletePrompt(currentDetailedPromptId);
      }
    });
    const favBtnDetail = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
    favBtnDetail?.addEventListener('click', () => {
      const promptId = promptDetailsSectionEl.dataset.currentPromptId || favBtnDetail.dataset.id;
      if (promptId) handleToggleFavorite(promptId);
    });

    promptTextViewMoreEl?.addEventListener('click', () => {
      if (promptTextWrapperEl && promptDetailTextEl && promptDetailsSectionEl) {
        const isExpanded = promptTextWrapperEl.classList.toggle('expanded');
        promptTextViewMoreEl.textContent = isExpanded ? getText('VIEW_LESS') : getText('VIEW_MORE');
        const fullText = promptDetailsSectionEl.dataset.fullPromptText || '';
        if (isExpanded) {
          promptDetailTextEl.textContent = fullText;
        } else {
          promptDetailTextEl.textContent =
            fullText.substring(0, PROMPT_TRUNCATE_LENGTH) +
            (fullText.length > PROMPT_TRUNCATE_LENGTH ? '...' : '');
        }
        if (window.Prism && promptDetailTextEl) {
          Prism.highlightElement(promptDetailTextEl);
        }

        // Track content selection for view more/less action
        if (window.DebugAnalytics) {
          const promptId = promptDetailsSectionEl.dataset.currentPromptId;
          const currentPrompt = allPrompts.find(p => p.id === promptId);
          if (currentPrompt) {
            window.DebugAnalytics.trackContentSelection({
              contentType: 'prompt',
              contentId: currentPrompt.id,
              promptId: currentPrompt.id,
              promptCategory: currentPrompt.category || 'unknown',
              source: 'prompt_details',
              method: isExpanded ? 'expand_text' : 'collapse_text',
              userRating: currentPrompt.currentUserRating || 0,
              isFavorite: currentPrompt.currentUserIsFavorite || false,
            });
          }
        }
      }
    });
  }
};

export const loadAndDisplayData = async () => {
  try {
    allPrompts = await PromptData.loadPrompts();

    // Populate filter dropdowns (category, tag, ai tool)
    // Use the predefined categories from categories.js instead of extracting from prompts
    const categories = new Set(PROMPT_CATEGORIES);
    const tags = new Set();
    const aiTools = new Set();
    allPrompts.forEach(p => {
      if (Array.isArray(p.tags)) p.tags.forEach(t => tags.add(t));
      if (Array.isArray(p.targetAiTools)) p.targetAiTools.forEach(t => aiTools.add(t));
    });
    // Helper to populate a select
    function populateSelect(selectEl, values, anyLabel = 'Any') {
      if (!selectEl) return;
      const current = selectEl.value;
      selectEl.innerHTML =
        `<option value="">${anyLabel}</option>` +
        Array.from(values)
          .sort()
          .map(v => `<option value="${Utils.escapeHTML(v)}">${Utils.escapeHTML(v)}</option>`)
          .join('');
      // Restore selection if possible
      if (current && selectEl.querySelector(`[value="${Utils.escapeHTML(current)}"]`)) {
        selectEl.value = current;
      }
    }
    populateSelect(categoryFilterEl, categories, 'Any');
    populateSelect(tagFilterEl, tags, 'Any');
    populateSelect(aiToolFilterEl, aiTools, 'Any');
    populateSelect(mainCategoryDropdownEl, categories, 'All Categories');

    await showTab(activeTab);
  } catch (error) {
    // Check for connection-specific errors and handle them
    if (error.message && error.message.includes('WebChannelConnection')) {
      console.log('WebChannel connection error detected in loadAndDisplayData');
      await handleConnectionError(error);
    }

    Utils.handleError('Error loading and displaying prompt data', {
      userVisible: true,
      originalError: error,
    });
    if (promptsListEl)
      promptsListEl.innerHTML = `<p class="empty-state">${getText('COULD_NOT_LOAD_PROMPTS')}</p>`;
  }
};

export const initializeUI = async () => {
  try {
    // Ensure auth chooser is wired when initializing the UI
    initializeAuthChooser();
    cacheDOMElements();
    setupEventListeners();
    await loadAndDisplayData();

    // Show/hide FAB based on login state AND main content visibility
    if (addPromptFabEl) {
      const updateFabVisibility = () => {
        const user = auth && auth.currentUser;
        const mainContent = document.getElementById('main-content');
        const authView = document.getElementById('auth-view');
        // Always hide FAB if auth view is visible
        if (authView && !authView.classList.contains('hidden')) {
          addPromptFabEl.hidden = true;
          return;
        }
        // Only show FAB if user is logged in AND main content is visible AND auth view is hidden
        const mainVisible = mainContent && !mainContent.classList.contains('hidden');
        addPromptFabEl.hidden = !(user && mainVisible);
      };
      if (auth && typeof auth.onAuthStateChanged === 'function') {
        auth.onAuthStateChanged(updateFabVisibility);
        updateFabVisibility();
      } else {
        addPromptFabEl.hidden = true;
      }
      // Also observe view changes
      const observer = new MutationObserver(updateFabVisibility);
      const mainContent = document.getElementById('main-content');
      const authView = document.getElementById('auth-view');
      if (mainContent)
        observer.observe(mainContent, { attributes: true, attributeFilter: ['class'] });
      if (authView) observer.observe(authView, { attributes: true, attributeFilter: ['class'] });
    }
  } catch (error) {
    Utils.handleError('Error initializing UI', { userVisible: true, originalError: error });
  }
};

export const showTab = async (which, opts = {}) => {
  const previousTab = activeTab;
  activeTab = which;
  if (tabAllEl) tabAllEl.classList.toggle('active', which === 'all');
  if (tabFavsEl) tabFavsEl.classList.toggle('active', which === 'favs');
  if (tabPrivateEl) tabPrivateEl.classList.toggle('active', which === 'private');

  // Track tab switching
  if (previousTab !== which && window.DebugPageTracker) {
    window.DebugPageTracker.trackTabSwitch(which, {
      previousTab: previousTab,
      method: opts.method || 'click',
    });
  }

  if (
    promptsListEl &&
    promptDetailsSectionEl &&
    !promptDetailsSectionEl.classList.contains('hidden')
  ) {
    if (promptsListEl) promptsListEl.classList.remove('hidden');
    if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('hidden');
    if (addPromptBarEl) addPromptBarEl.classList.remove('hidden');
    if (controlsEl) controlsEl.classList.remove('hidden');
    if (tabsContainerEl) tabsContainerEl.classList.remove('hidden');
  }

  const searchStartTime = Date.now();

  const filters = {
    tab: which,
    searchTerm: searchInputEl ? searchInputEl.value : '',
    minRating: minRatingSelectEl ? parseInt(minRatingSelectEl.value) : 0,
    minUserRating: minUserRatingSelectEl ? parseInt(minUserRatingSelectEl.value) : 0,
    yourPromptsOnly: yourPromptsOnlyEl ? yourPromptsOnlyEl.checked : false,
    usedByYou: usedByYouEl ? usedByYouEl.checked : false,
    // Use mainCategoryDropdownEl for category filter, fallback to categoryFilterEl for safety
    category: mainCategoryDropdownEl
      ? mainCategoryDropdownEl.value
      : categoryFilterEl
        ? categoryFilterEl.value
        : '',
    tag: tagFilterEl ? tagFilterEl.value : '',
    aiTool: aiToolFilterEl ? aiToolFilterEl.value : '',
    dateFrom: dateFromEl ? dateFromEl.value : '',
    dateTo: dateToEl ? dateToEl.value : '',
    updatedFrom: updatedFromEl ? updatedFromEl.value : '',
    updatedTo: updatedToEl ? updatedToEl.value : '',
    sortBy: currentSortBy,
    sortDir: currentSortDir,
  };
  const promptsToFilter = Array.isArray(allPrompts) ? allPrompts : [];
  const filtered = PromptData.filterPrompts(promptsToFilter, filters);

  // Track search event if search term is provided
  if (filters.searchTerm && filters.searchTerm.trim() && window.DebugAnalytics) {
    const searchDuration = Date.now() - searchStartTime;
    const filtersUsed = [];

    // Collect active filters for analytics
    if (filters.category && filters.category !== 'all') filtersUsed.push('category');
    if (filters.tag && filters.tag !== 'all') filtersUsed.push('tag');
    if (filters.aiTool && filters.aiTool !== 'all') filtersUsed.push('aiTool');
    if (filters.minRating > 0) filtersUsed.push('minRating');
    if (filters.minUserRating > 0) filtersUsed.push('minUserRating');
    if (filters.yourPromptsOnly) filtersUsed.push('yourPromptsOnly');
    if (filters.usedByYou) filtersUsed.push('usedByYou');
    if (filters.dateFrom) filtersUsed.push('dateFrom');
    if (filters.dateTo) filtersUsed.push('dateTo');
    if (filters.updatedFrom) filtersUsed.push('updatedFrom');
    if (filters.updatedTo) filtersUsed.push('updatedTo');

    window.DebugAnalytics.trackPromptSearch({
      query: filters.searchTerm.trim(),
      resultsCount: filtered.length,
      searchType: 'client_filter',
      filtersUsed: filtersUsed,
      duration: searchDuration,
      activeTab: which,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    });
  }

  await displayPrompts(filtered, opts);
  updateResetFiltersButtonVisibility();
};

// Clusterize.js instance for virtualized prompt list
let clusterizeInstance = null;

/**
 * Wait for stylesheets to load before initializing layout-dependent components
 * This prevents "Layout was forced before the page was fully loaded" warnings
 */
function waitForStylesheetsToLoad() {
  return new Promise(resolve => {
    // Check if all stylesheets are loaded
    const stylesheets = Array.from(document.styleSheets);

    // If no stylesheets or all are loaded, resolve immediately
    if (stylesheets.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalCount = stylesheets.length;

    function checkStylesheet(stylesheet) {
      try {
        // Try to access cssRules to check if stylesheet is loaded
        // This will throw an error if stylesheet is not loaded
        void stylesheet.cssRules; // Access cssRules to trigger loading check
        return true;
      } catch {
        return false;
      }
    }

    function checkAllStylesheets() {
      loadedCount = 0;
      for (const stylesheet of stylesheets) {
        if (checkStylesheet(stylesheet)) {
          loadedCount++;
        }
      }

      if (loadedCount === totalCount) {
        resolve();
      } else {
        // Check again after a short delay
        setTimeout(checkAllStylesheets, 10);
      }
    }

    // Start checking
    checkAllStylesheets();

    // Fallback: resolve after maximum wait time to prevent hanging
    setTimeout(() => {
      resolve();
    }, 500); // Maximum 500ms wait
  });
}

export const displayPrompts = async (prompts, opts = {}) => {
  // Use Clusterize.js for virtualization
  const scrollElem = document.getElementById('scrollable-main');
  const contentElem = document.getElementById('prompts-list-content');
  if (!scrollElem || !contentElem) return;

  // Handle empty state
  if (prompts.length === 0) {
    if (clusterizeInstance) {
      clusterizeInstance.update([]);
    }
    contentElem.innerHTML = `<div class="empty-state"><p>${getText('NO_PROMPTS_FOUND')}</p></div>`;
    // Reset scroll position
    scrollElem.scrollTop = 0;

    // Track empty search results
    if (window.DebugAnalytics) {
      const searchInput = document.getElementById('search-input');
      const searchTerm = searchInput ? searchInput.value.trim() : '';

      if (searchTerm) {
        window.DebugAnalytics.trackCustomEvent('search_no_results', {
          search_term: searchTerm,
          active_tab: activeTab,
          context: 'popup',
        });
      }
    }

    return;
  }

  // Generate HTML rows for Clusterize, always using the latest prompt data from allPrompts by ID
  const rows = prompts.map(p => {
    // Use the latest prompt object from allPrompts if available, otherwise use p directly
    const prompt =
      Array.isArray(allPrompts) && allPrompts.length > 0
        ? allPrompts.find(ap => ap.id === p.id) || p
        : p;
    const isFavoriteDisplay = prompt.currentUserIsFavorite || false;
    const privateIcon = prompt.isPrivate
      ? `<i class="fa-solid fa-lock prompt-private-icon" title="Private" aria-label="Private"></i>`
      : '';
    // Truncate description to 2 lines with ellipsis (CSS will handle the visual, but we can limit chars for fallback)
    const desc = Utils.escapeHTML(prompt.description || '').replace(/\n/g, ' ');
    const descShort = desc.length > 120 ? desc.slice(0, 120) + '…' : desc;
    // Tools/compatibility pills
    // Prefer targetAiTools, fallback to aiTools/tools for legacy
    const toolsArr =
      Array.isArray(prompt.targetAiTools) && prompt.targetAiTools.length > 0
        ? prompt.targetAiTools
        : Array.isArray(prompt.aiTools) && prompt.aiTools.length > 0
          ? prompt.aiTools
          : Array.isArray(prompt.tools) && prompt.tools.length > 0
            ? prompt.tools
            : [];
    const tools = toolsArr
      .map(tool => `<span class="tool-pill">${Utils.escapeHTML(tool)}</span>`)
      .join('');
    const toolsSection = toolsArr.length
      ? `<div class="prompt-detail-tools-label">Compatible with</div>\n         <div class="prompt-detail-tools">${tools}</div>`
      : '';
    // Community rating (read-only stars)
    const avgRating =
      typeof prompt.averageRating === 'number' ? prompt.averageRating.toFixed(1) : '-';
    const stars = createStars(prompt.averageRating || 0, prompt.id, false);
    const starsHtml = stars.outerHTML;
    const favCount = prompt.favoritesCount || 0;

    // Matched fields for search highlighting
    const matchedFieldsHtml =
      prompt.matchedIn && Array.isArray(prompt.matchedIn) && prompt.matchedIn.length > 0
        ? `<div class="matched-fields" aria-label="Matched fields: ${prompt.matchedIn.join(', ')}">${prompt.matchedIn
            .map(
              f =>
                `<span class="matched-field-badge" aria-label="Matched in ${Utils.escapeHTML(f)}"><span class="visually-hidden">Matched in </span>${Utils.escapeHTML(f)}</span>`
            )
            .join(' ')}<span class="matched-fields-label"> matched</span></div>`
        : '';

    // Category row with background color
    const categoryRow = prompt.category
      ? `<div class="prompt-card__category-row">
           <span class="prompt-card__category">${Utils.escapeHTML(prompt.category)}</span>
         </div>`
      : '';

    // --- NEW STRUCTURE: div.prompt-card-btn as top-level container ---
    return `
      <div class="prompt-card-btn" tabindex="0" aria-label="${textManager.format('VIEW_DETAILS_FOR_PROMPT', { title: Utils.escapeHTML(prompt.title) })}" data-id="${prompt.id}">
        <div class="prompt-card__header-bg">
          ${categoryRow}
          <div class="prompt-item__header">
            <div class="prompt-title-row">
              ${privateIcon ? `<span class="prompt-private-icon">${privateIcon}</span>` : ''}
              <span class="prompt-item__title">${Utils.escapeHTML(prompt.title)}</span>
            </div>
            <div class="prompt-item__actions">
              <!-- Only favorite button here now -->
            </div>
          </div>
          <div class="prompt-card__description">${descShort}</div>
          ${matchedFieldsHtml}
        </div>
        <div class="prompt-card__tags tags">
          ${(prompt.tags || []).map(t => `<span class="prompt-card__tag tag">${Utils.escapeHTML(t)}</span>`).join('')}
        </div>
        ${toolsSection}
        <div class="prompt-card-bottom">
          <div class="community-rating-section">
            ${starsHtml}
            <span class="avg-rating">(${avgRating})</span>
          </div>
          <button class="toggle-favorite${isFavoriteDisplay ? ' active' : ''}" data-id="${Utils.escapeHTML(prompt.id)}" aria-label="${getText('TOGGLE_FAVORITE')}" aria-pressed="${isFavoriteDisplay}">
            <i class="${isFavoriteDisplay ? 'fas' : 'far'} fa-heart"></i> <span>${favCount}</span>
          </button>
        </div>
      </div>
    `;
  });

  // Wait for stylesheets to load before initializing Clusterize to prevent FOUC
  if (!clusterizeInstance) {
    await waitForStylesheetsToLoad();
  }

  // Initialize or update Clusterize
  if (!clusterizeInstance) {
    clusterizeInstance = new window.Clusterize({
      rows,
      scrollElem,
      contentElem,
      tag: 'div',
      callbacks: {
        clusterChanged: () => {
          // Update prompt counter
          const counter = document.getElementById('prompt-counter');
          if (counter)
            counter.textContent = `${prompts.length} prompt${prompts.length === 1 ? '' : 's'} found`;
        },
      },
    });
  } else {
    clusterizeInstance.update(rows);
    // Update prompt counter
    const counter = document.getElementById('prompt-counter');
    if (counter)
      counter.textContent = `${prompts.length} prompt${prompts.length === 1 ? '' : 's'} found`;
  }
  // Restore scroll position if requested (e.g., after favorite toggle), else reset to top
  if (opts && typeof opts.preserveScrollTop === 'number') {
    scrollElem.scrollTop = opts.preserveScrollTop;
  } else {
    scrollElem.scrollTop = 0;
  }
};

const showPromptList = () => {
  if (promptsListEl) promptsListEl.classList.remove('hidden');
  if (promptDetailsSectionEl) promptDetailsSectionEl.classList.add('hidden');
  if (controlsEl) controlsEl.classList.remove('hidden');
  if (tabsContainerEl) tabsContainerEl.classList.remove('hidden');
  if (addPromptBarEl) addPromptBarEl.classList.remove('hidden');

  // Show main-controls and prompt-counter-row explicitly
  const mainControls = document.querySelector('section.main-controls');
  if (mainControls) mainControls.classList.remove('hidden');
  const promptCounterRow = document.querySelector('.prompt-counter-row');
  if (promptCounterRow) promptCounterRow.classList.remove('hidden');

  // Show category dropdown bar in list view
  const categoryDropdownBar = document.querySelector('.category-dropdown-bar');
  if (categoryDropdownBar) categoryDropdownBar.classList.remove('hidden');

  // Track navigation back to main list
  if (window.DebugPageTracker) {
    window.DebugPageTracker.trackNavigation('main', {
      method: 'click',
      trigger: 'user',
    });
  }

  showTab(activeTab);
};

const showPromptDetailsView = () => {
  if (promptsListEl) promptsListEl.classList.add('hidden');
  if (promptDetailsSectionEl) promptDetailsSectionEl.classList.remove('hidden');
  if (controlsEl) controlsEl.classList.add('hidden');
  if (tabsContainerEl) tabsContainerEl.classList.add('hidden');
  if (addPromptBarEl) addPromptBarEl.classList.add('hidden');

  // Hide main-controls and prompt-counter-row explicitly
  const mainControls = document.querySelector('section.main-controls');
  if (mainControls) mainControls.classList.add('hidden');
  const promptCounterRow = document.querySelector('.prompt-counter-row');
  if (promptCounterRow) promptCounterRow.classList.add('hidden');

  // Hide category dropdown bar in details view
  const categoryDropdownBar = document.querySelector('.category-dropdown-bar');
  if (categoryDropdownBar) categoryDropdownBar.classList.add('hidden');
};

const createStars = (ratingValue, promptId, isInteractive = true) => {
  const starWrapper = document.createElement('div');
  starWrapper.classList.add('star-rating-display');
  if (isInteractive) {
    starWrapper.classList.add('interactive');
  }
  starWrapper.dataset.promptId = promptId;

  for (let i = 1; i <= 5; i++) {
    const starButton = document.createElement('button');
    starButton.classList.add('star');
    starButton.dataset.value = i;
    starButton.setAttribute('aria-label', `${i} star${i !== 1 ? 's' : ''}`);
    starButton.innerHTML =
      i <= ratingValue ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    if (i <= ratingValue) {
      starButton.classList.add('filled');
    }
    if (isInteractive) {
      starButton.addEventListener('click', async event => {
        event.stopPropagation();
        await handleRatePrompt(promptId, i);
      });
    } else {
      starButton.disabled = true;
      starButton.style.cursor = 'default';
    }
    starWrapper.appendChild(starButton);
  }
  return starWrapper;
};

export const displayPromptDetails = prompt => {
  if (!prompt || !promptDetailsSectionEl) return;
  showPromptDetailsView();
  promptDetailsSectionEl.dataset.currentPromptId = prompt.id;
  promptDetailsSectionEl.dataset.fullPromptText = prompt.text || '';

  // Always reset view to static (non-edit) mode
  if (!promptDetailStaticFieldsWrapperEl)
    promptDetailStaticFieldsWrapperEl = document.getElementById(
      'prompt-detail-static-fields-wrapper'
    );
  if (!promptDetailEditableFieldsWrapperEl)
    promptDetailEditableFieldsWrapperEl = document.getElementById(
      'prompt-detail-editable-fields-wrapper'
    );
  if (!promptEditActionsBarEl)
    promptEditActionsBarEl = document.getElementById('prompt-edit-actions-bar');
  if (!promptOwnerActionsBarEl)
    promptOwnerActionsBarEl = document.getElementById('prompt-owner-actions-bar');

  // Show static fields, hide edit fields and edit actions
  if (promptDetailStaticFieldsWrapperEl)
    promptDetailStaticFieldsWrapperEl.classList.remove('hidden');
  if (promptDetailEditableFieldsWrapperEl)
    promptDetailEditableFieldsWrapperEl.classList.add('hidden');
  if (promptEditActionsBarEl) {
    promptEditActionsBarEl.classList.add('hidden');
    promptEditActionsBarEl.style.display = 'none'; // Explicitly hide with inline style
  }

  // Remove global edit mode classes when viewing prompt details
  document.body.classList.remove('editing-prompt', 'adding-prompt');

  // Remove editing class from prompt details section
  if (promptDetailsSectionEl) promptDetailsSectionEl.classList.remove('editing');

  // Reset any inline styles for edit buttons
  const editButtons = document.getElementById('edit-prompt-buttons');
  const addButtons = document.getElementById('add-prompt-buttons');
  if (editButtons) {
    editButtons.classList.add('hidden');
    editButtons.style.display = 'none';
  }
  if (addButtons) {
    addButtons.classList.add('hidden');
    addButtons.style.display = 'none';
  }

  // Remove edit mode heading if it exists
  const editHeading = document.getElementById('edit-mode-heading');
  if (editHeading && editHeading.parentNode) {
    editHeading.parentNode.removeChild(editHeading);
  }

  // Make elements visible again that might have been hidden during edit mode
  // 1. Prompt header (title, copy, favorite)
  const promptHeader = document.querySelector('.prompt-item__header');
  if (promptHeader) promptHeader.classList.remove('hidden');

  // 2. Prompt category and tags
  const promptCategory = document.getElementById('prompt-detail-category');
  if (promptCategory) promptCategory.classList.remove('hidden');

  const promptTags = document.getElementById('prompt-detail-tags');
  if (promptTags) promptTags.classList.remove('hidden');

  // 3. Back to list button
  const backToListButton = document.getElementById('back-to-list-button');
  if (backToListButton) backToListButton.classList.remove('hidden');

  // Show ratings and FAB again when not editing
  if (userStarRatingEl && userStarRatingEl.parentElement) {
    userStarRatingEl.parentElement.classList.remove('hidden');
  }
  if (communityRatingSectionEl) {
    communityRatingSectionEl.classList.remove('hidden');
  }
  if (addPromptFabEl) {
    addPromptFabEl.classList.remove('hidden');
  }

  const setText = (el, text) => {
    if (el) el.textContent = text || 'N/A';
  };
  const formatArray = arr => (arr && arr.length > 0 ? arr.join(', ') : 'None');
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // Add private icon to the left of the title if private
  if (promptDetailTitleEl) {
    if (prompt.isPrivate) {
      promptDetailTitleEl.innerHTML = `<i class='fa-solid fa-lock prompt-private-icon' title='Private' aria-label='Private' style='margin-right:0.5em; color:#e74c3c;'></i>${Utils.escapeHTML(prompt.title)}`;
    } else {
      promptDetailTitleEl.textContent = prompt.title;
    }
  }
  setText(promptDetailDescriptionEl, prompt.description);
  setText(promptDetailCategoryEl, prompt.category);
  setText(promptDetailTagsEl, formatArray(prompt.tags));
  setText(promptDetailToolsEl, formatArray(prompt.targetAiTools));
  setText(promptDetailAuthorEl, prompt.authorDisplayName);
  setText(promptDetailCreatedEl, formatDate(prompt.createdAt));
  setText(promptDetailUpdatedEl, formatDate(prompt.updatedAt));
  setText(promptDetailUsageEl, prompt.usageCount?.toString() || '0');
  setText(promptDetailFavoritesEl, prompt.favoritesCount?.toString() || '0');

  // Update community rating label if present
  const communityLabel = document.getElementById('community-rating-label');
  if (communityLabel) communityLabel.textContent = getText('AVERAGE_VIBES');

  if (promptDetailTextEl && promptTextWrapperEl && promptTextViewMoreEl) {
    const fullText = prompt.text || '';
    if (fullText.length > PROMPT_TRUNCATE_LENGTH) {
      promptDetailTextEl.textContent = fullText.substring(0, PROMPT_TRUNCATE_LENGTH) + '...';
      promptTextViewMoreEl.classList.remove('hidden');
      promptTextViewMoreEl.textContent = getText('VIEW_MORE');
      promptTextWrapperEl.classList.remove('expanded');
    } else {
      promptDetailTextEl.textContent = fullText;
      promptTextViewMoreEl.classList.add('hidden');
      promptTextWrapperEl.classList.remove('expanded');
    }
    if (window.Prism && promptDetailTextEl) {
      Prism.highlightElement(promptDetailTextEl);
    }
  } else {
    if (promptDetailTextEl) setText(promptDetailTextEl, prompt.text);
  }

  const currentUser = auth ? auth.currentUser : null;
  const favBtn = promptDetailsSectionEl.querySelector('#toggle-fav-detail');
  if (favBtn) {
    favBtn.dataset.id = prompt.id;
    const icon = favBtn.querySelector('i');
    const isFavoriteDisplay = prompt.currentUserIsFavorite || false;
    if (icon) icon.className = isFavoriteDisplay ? 'fas fa-heart' : 'far fa-heart';
  }

  const isOwner = currentUser && prompt.userId === currentUser.uid;
  if (promptOwnerActionsEl) {
    if (isOwner) {
      promptOwnerActionsEl.classList.remove('hidden');
      promptOwnerActionsEl.style.display = 'flex';
      if (editPromptButtonEl) editPromptButtonEl.disabled = false;
      if (deletePromptTriggerButtonEl) deletePromptTriggerButtonEl.disabled = false;
    } else {
      promptOwnerActionsEl.classList.add('hidden');
      promptOwnerActionsEl.style.display = 'none';
      if (editPromptButtonEl) editPromptButtonEl.disabled = true;
      if (deletePromptTriggerButtonEl) deletePromptTriggerButtonEl.disabled = true;
    }
  } else {
    if (editPromptButtonEl) editPromptButtonEl.style.display = 'none';
    if (deletePromptTriggerButtonEl) deletePromptTriggerButtonEl.style.display = 'none';
  }

  if (userStarRatingEl) userStarRatingEl.innerHTML = '';
  if (userRatingMessageEl) userRatingMessageEl.textContent = '';
  if (communityStarDisplayEl) communityStarDisplayEl.innerHTML = '';
  if (communityRatingSectionEl) communityRatingSectionEl.classList.add('hidden');

  if (currentUser) {
    const currentRating = prompt.currentUserRating || 0;
    userStarRatingEl.appendChild(createStars(currentRating, prompt.id, true));
    if (userRatingMessageEl) {
      userRatingMessageEl.textContent =
        currentRating > 0 ? getText('YOUR_RATING') : getText('RATE_PROMPT');
    }
  } else {
    if (userRatingMessageEl) userRatingMessageEl.textContent = getText('LOGIN_TO_RATE');
    if (userStarRatingEl) userStarRatingEl.appendChild(createStars(0, prompt.id, false));
  }

  if (!prompt.isPrivate) {
    if (
      communityRatingSectionEl &&
      communityAverageRatingValueEl &&
      communityRatingCountEl &&
      communityStarDisplayEl
    ) {
      communityRatingSectionEl.classList.remove('hidden');
      const averageRating = prompt.averageRating || 0;
      const totalRatingsCount = prompt.totalRatingsCount || 0;

      communityStarDisplayEl.appendChild(createStars(Math.round(averageRating), prompt.id, false));
      setText(communityAverageRatingValueEl, `(${averageRating.toFixed(1)})`);
      setText(
        communityRatingCountEl,
        `(${totalRatingsCount} ${totalRatingsCount === 1 ? 'rating' : 'ratings'})`
      );
    }
  } else {
    if (communityRatingSectionEl) communityRatingSectionEl.classList.add('hidden');
  }

  if (deleteConfirmationEl) deleteConfirmationEl.classList.add('hidden');
};

export const viewPromptDetails = async promptId => {
  console.log(`[UI SUT LOG] viewPromptDetails called with promptId: ${promptId}`); // Log entry
  try {
    const prompt = await PromptData.findPromptById(promptId);
    console.log(
      `[UI SUT LOG] viewPromptDetails: findPromptById returned: ${JSON.stringify(prompt)}`
    ); // Log fetched prompt
    if (prompt) {
      console.log('[UI SUT LOG] viewPromptDetails: Prompt found, calling displayPromptDetails.'); // Log before call
      displayPromptDetails(prompt);

      // Track page view for prompt details
      if (window.DebugPageTracker) {
        window.DebugPageTracker.trackNavigation('prompt_details', {
          method: 'click',
          trigger: 'user',
        });
      }

      // Track prompt view analytics
      if (window.DebugAnalytics) {
        window.DebugAnalytics.trackPromptView({
          id: prompt.id,
          category: prompt.category,
          type: prompt.type || 'text',
          content: prompt.promptText,
          source: 'prompt_list',
          isFavorite: prompt.currentUserIsFavorite,
          userRating: prompt.currentUserRating || 0,
        });

        // Track content selection for prompt details view
        window.DebugAnalytics.trackContentSelection({
          contentType: 'prompt',
          contentId: prompt.id,
          promptId: prompt.id,
          promptCategory: prompt.category || 'unknown',
          source: 'prompt_list',
          method: 'click',
          userRating: prompt.currentUserRating || 0,
          isFavorite: prompt.currentUserIsFavorite || false,
        });

        // Track prompt engagement funnel - viewed
        window.DebugAnalytics.trackPromptEngagementFunnel({
          step: 'viewed',
          stepNumber: 1,
          promptId: prompt.id,
          promptCategory: prompt.category || 'unknown',
          promptLength: prompt.promptText?.length || 0,
          isFavorite: prompt.currentUserIsFavorite || false,
          userRating: prompt.currentUserRating || 0,
          engagementDepth: 'surface',
        });

        // Track onboarding funnel - first interaction (if this is early in user journey)
        if (window.firebaseAuthCurrentUser) {
          window.DebugAnalytics.trackOnboardingFunnel({
            step: 'first_interaction',
            stepNumber: 3,
            userId: window.firebaseAuthCurrentUser.uid,
            interactionType: 'view',
            promptsAvailable: allPrompts?.length || 0,
          });
        }
      }
    } else {
      throw new Error(`Prompt with ID ${promptId} not found`);
    }
  } catch (error) {
    Utils.handleError(`Error viewing prompt details: ${error.message}`, {
      userVisible: true,
      originalError: error,
    });
  }
};

export const getStarRatingContainerElementForTest = () => userStarRatingEl;

// Add a spinner element to the DOM if it doesn't exist
function ensureSearchSpinner() {
  let spinner = document.getElementById('search-loading-spinner');
  if (!spinner) {
    spinner = document.createElement('div');
    spinner.id = 'search-loading-spinner';
    spinner.className = 'search-loading-spinner';
    spinner.innerHTML = '<span class="spinner"></span> Searching...';
    spinner.style.display = 'none';
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
      searchBar.appendChild(spinner);
    } else {
      document.body.appendChild(spinner);
    }
  }
  return spinner;
}

// Show/hide spinner helpers
function showSearchSpinner() {
  const spinner = ensureSearchSpinner();
  spinner.style.display = 'inline-flex';
}
function hideSearchSpinner() {
  const spinner = document.getElementById('search-loading-spinner');
  if (spinner) spinner.style.display = 'none';
}

// Show error message in search area
function showSearchError(message) {
  let errorEl = document.getElementById('search-error-message');
  if (!errorEl) {
    errorEl = document.createElement('div');
    errorEl.id = 'search-error-message';
    errorEl.className = 'error-message';
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
      searchBar.appendChild(errorEl);
    } else {
      document.body.appendChild(errorEl);
    }
  }
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}
function hideSearchError() {
  const errorEl = document.getElementById('search-error-message');
  if (errorEl) errorEl.style.display = 'none';
}

// Show search timing info
function showSearchTiming(durationMs) {
  let timingEl = document.getElementById('search-timing-info');
  if (!timingEl) {
    timingEl = document.createElement('div');
    timingEl.id = 'search-timing-info';
    timingEl.className = 'search-timing-info';
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
      searchBar.appendChild(timingEl);
    } else {
      document.body.appendChild(timingEl);
    }
  }
  timingEl.textContent = `Search completed in ${durationMs}ms`;
  timingEl.style.display = 'block';
}
function hideSearchTiming() {
  const timingEl = document.getElementById('search-timing-info');
  if (timingEl) timingEl.style.display = 'none';
}

// Update search input event handler to show timing
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      let searchTimeout;

      searchInput.addEventListener('input', async e => {
        const query = e.target.value.trim();

        // Clear previous timeout to debounce search requests
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }

        if (!query) {
          hideSearchTiming();
          hideSearchError();
          // Trigger normal filtering when search is cleared
          showTab(activeTab);
          return;
        }

        // Debounce server search calls (500ms delay)
        searchTimeout = setTimeout(async () => {
          showSearchSpinner();
          hideSearchError();
          const searchStartTime = Date.now();

          try {
            // Use the new server-side search
            const searchResult = await PromptData.searchPromptsServer(query, 50);
            const searchDuration = Date.now() - searchStartTime;

            if (searchResult && searchResult.results) {
              // Log search response time for metrics
              if (typeof searchResult.durationMs === 'number') {
                console.log(
                  `[PromptFinder] Server search for "${query}" took ${searchResult.durationMs}ms`
                );
                showSearchTiming(searchResult.durationMs);
              }

              // Track server-side search analytics
              if (window.DebugAnalytics) {
                window.DebugAnalytics.trackPromptSearch({
                  query: query,
                  resultsCount: searchResult.results.length,
                  searchType: 'server_search',
                  filtersUsed: [], // Server search doesn't use client filters
                  duration: searchDuration,
                  serverDuration: searchResult.durationMs || 0,
                  totalResults: searchResult.total || searchResult.results.length,
                  activeTab: activeTab,
                });
              }

              // Display the server search results
              displayPrompts(searchResult.results);

              // Update counter for server search results
              const counter = document.getElementById('prompt-counter');
              if (counter) {
                counter.textContent = `${searchResult.results.length} prompt${searchResult.results.length === 1 ? '' : 's'} found (server search)`;
              }
            }
          } catch (error) {
            const searchDuration = Date.now() - searchStartTime;

            // Track failed search
            if (window.DebugAnalytics) {
              window.DebugAnalytics.trackError({
                error_type: 'server_search_failed',
                error_message: error.message || 'Server search failed',
                search_query: query,
                duration: searchDuration,
                context: 'search_input',
              });
            }

            showSearchError('Search failed. Please try again.');
            hideSearchTiming();
            console.error('[PromptFinder] Server search failed:', error);
          } finally {
            hideSearchSpinner();
          }
        }, 500); // 500ms debounce delay
      });
    }
  });
}

// Set localized label for copy prompt button in details view
const copyPromptLabelEl = document.getElementById('copy-prompt-label');
if (copyPromptLabelEl) copyPromptLabelEl.textContent = getText('COPY_PROMPT_LABEL');

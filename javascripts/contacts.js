$(function() {
  var $form = $('#add');
  var $list = $('#contactsList ul');
  var $edit = $('#edit');
  var $newTag = $('#addNewTag');
  var $tagList = $('#tagRadios');
  var $currentTags = $('#currentTags ul');
  var $tagSearch = $('#tagSearch ul');
  var $contactsSearch = $('#searchContacts');
  var $addContactButton = $('#grayBlock div #addContact');
  var $manageTagsButton = $('#grayBlock div #manageTags');
  var $tagManager = $('#tagManagerModal');

  var manageContacts = {
    contactID: 0,
    tags: [{tag: 'Family'}, {tag: 'Friends'}, {tag: 'Work'}],
    contacts: [],
    incrementContactID: function() {
      this.contactID++;
      this.storeContactID();
    },
    resetContactID: function() {
      this.contactID = 0;
      this.storeContactID();
    },
    createTemplates: function() {
      this.contactTemplate =        Handlebars.compile($('#contactTemplate').html());
      this.contactsListTemplate =   Handlebars.compile($('#contactsListTemplate').remove().html());
      this.editContactInfo =        Handlebars.compile($('#editContactInfo').remove().html());
      this.tagTemplate =            Handlebars.compile($('#tagTemplate').html());
      this.tagTemplate2 =           Handlebars.compile($('#tagTemplate2').html());
      this.tagListTemplate =        Handlebars.compile($('#tagListTemplate').remove().html());
      this.tagManagementTemplate =  Handlebars.compile($('#tagManagementTemplate').remove().html());
      this.tagSearchTemplate =      Handlebars.compile($('#tagSearchTemplate').html());
      this.tagSearchListTemplate =  Handlebars.compile($('#tagSearchListTemplate').remove().html());

      Handlebars.registerPartial('contactTemplate', $('#contactTemplate').remove().html());
      Handlebars.registerPartial('tagTemplate', $('#tagTemplate').remove().html());
      Handlebars.registerPartial('tagTemplate2', $('#tagTemplate2').remove().html());
      Handlebars.registerPartial('tagDeleteTemplate', $('#tagDeleteTemplate').remove().html());
      Handlebars.registerPartial('tagSearchTemplate', $('#tagSearchTemplate').remove().html());
    },
    getFormObject: function($f) {
      var obj = {};

      $f.serializeArray().forEach(function(input) {
        obj[input.name] = input.value.trim();
      });

      if (!obj.id) {
        obj.id = this.contactID;
      } else if (typeof obj.id === 'string') {
        obj.id = Number(obj.id);
      }

      return obj;
    },
    createTag: function(e) {
      var value = $(e.currentTarget).find('#newTag').val();
      var tagObj = { tag: value };

      e.preventDefault();
      this.addTag(tagObj);
      this.setupTagSearch();
      this.closeModal($tagManager);
      setTimeout( function() { e.currentTarget.reset() }, 1000);
    },
    addTag: function(tagObj) {
      this.tags.push(tagObj);
      this.storeTags();
      $tagList.append(this.tagTemplate(tagObj));
    },
    addAllTagsToList: function() {
      $tagList.html(this.tagListTemplate({tag: this.tags}));
    },
    deleteTags: function(e) {
      e.preventDefault();

      var allTags = Array.prototype.slice.call($(e.currentTarget).closest('div').find(':checkbox'));
      var tagsToDelete = allTags.map(function(t) {
        if (t.checked) {
          return t.value;
        } else {
          return false;
        }
      }).filter(function(f) { return f; });

      this.tags = this.tags.filter(function(obj) {
        return tagsToDelete.indexOf(obj['tag']) === -1;
      });

      this.storeTags();
      this.setupTagSearch();
      this.addAllTagsToList();

      for (var i = 0, len = tagsToDelete.length; i < len; i++) {
        this.removeTagFromContacts(tagsToDelete[i]);
      }
      this.closeModal($tagManager);
    },
    removeTagFromContacts: function(tagToRemove) {
      this.contacts.forEach(function(obj) {
        if (obj.tag === tagToRemove) {
          delete obj.tag;
        }
      });

      this.storeContacts();
    },
    searchTags: function(e) {
      e.preventDefault();

      var $checkboxes = $(e.currentTarget).closest('ul').find(':checkbox');
      var checked = [];
      var filteredContacts;

      for (var i = 0, len = $checkboxes.length; i < len; i++) {
        if ($checkboxes[i].checked) {
          checked.push($checkboxes[i].value)
        }
      }

      filteredContacts = this.contacts.filter(function(contact) {
          return checked.indexOf(contact.tag) !== -1;
      });

      if (filteredContacts.length === 0 && checked.length === 0) {
        this.addContactsToList(this.contacts);
      } else {
        this.addContactsToList(filteredContacts);
      }
    },
    createContact: function(e) {
      var data;

      e.preventDefault();
      this.incrementContactID();
      data = this.getFormObject($(e.currentTarget));

      this.addContact(data);
      this.closeModal($('#createContact'));
      setTimeout( function() { e.currentTarget.reset() }, 1000);
    },
    addContact: function(data) {
      this.contacts.push(data);
      this.addContactsToList(this.contacts);
      this.storeContacts();
    },
    addContactsToList: function(contactsToAdd) {
      var alphabetized = contactsToAdd.sort(function(a, b) {
        return a.name > b.name;
      });
      $list.html(this.contactsListTemplate({ contacts: alphabetized }));
    },
    editContact: function(e) {
      e.preventDefault();

      var id = Number($(e.currentTarget).closest('li').attr('data-id'));
      var tagsCopy = JSON.parse(JSON.stringify(this.tags));
      var contact = this.contacts.filter(function(c) {
        return c.id === id;
      })[0];

      contact.tags = tagsCopy.map(function(t) {
        if (t.tag === contact.tag) {
          t.checked = true;
        }
        return t;
      });

      $edit.html(this.editContactInfo(contact));
      this.openModal($edit);
      delete contact.tags;
    },
    rewriteContactInfo: function(e) {
      e.preventDefault();
      var data = this.getFormObject($(e.currentTarget));

      this.contacts = this.contacts.map(function(contact) {
        if (contact.id === data.id) {
          return data;
        }

        return contact;
      });

      this.closeModal($edit);
      setTimeout( function() { $edit.find('form').remove() }, 1000);
      this.storeContacts();
      this.addContactsToList(this.contacts);
    },
    deleteContact: function(e) {
      var contactToDeleteID = Number($(e.currentTarget).closest('li').attr('data-id'));

      e.preventDefault();
      $(e.currentTarget).closest('li').remove();

      this.contacts = this.contacts.filter(function(contact) {
        return contact.id !== contactToDeleteID;
      });

      this.storeContacts();
    },
    search: function(e) {
      var searchText = $(e.currentTarget).val();
      var filteredContacts;

      e.preventDefault();

      filteredContacts = this.contacts.filter(function(contact) {
        var regex = new RegExp('^' + searchText, 'i');
        return contact.name.match(regex);
      });

      this.addContactsToList(filteredContacts);
    },
    cancelAddForm: function(e) {
      e.preventDefault();
      this.closeModal($('#createContact'));
      setTimeout( function() { $(e.currentTarget).closest('form')[0].reset() }, 1000);
    },
    cancelEditForm: function(e) {
      e.preventDefault();
      var $editForm = $(e.currentTarget).closest('form');
      this.closeModal($edit);
      setTimeout( function() { $editForm.remove() }, 1000);
    },
    cancelTagForm: function(e) {
      e.preventDefault();
      this.closeModal($tagManager);
      setTimeout( function() { $('#tagManagerModal form')[0].reset() }, 1000);
    },
    openAddContactModal: function(e) {
      e.preventDefault();
      this.openModal($('#createContact'));
    },
    openTagManagerModal: function(e) {
      e.preventDefault();
      $currentTags.html(this.tagManagementTemplate({tag: this.tags}));
      this.openModal($tagManager);
    },
    openModal: function(modal) {
      $('#modalLayer').fadeIn(1000);
      modal.slideDown(600);
    },
    closeModal: function(modal) {
      $('#modalLayer').fadeOut(1000);
      modal.slideUp(600);
    },
    setupTagSearch: function() {
      $tagSearch.html(this.tagSearchListTemplate({tag: this.tags}));
    },
    storeContactID: function() {
      localStorage.setItem('contactID', JSON.stringify(this.contactID));
    },
    storeTags: function() {
      localStorage.setItem('tags', JSON.stringify(this.tags));
    },
    storeContacts: function() {
      localStorage.setItem('contacts', JSON.stringify(this.contacts));
    },
    setupLocalStorage: function() {
      localStorage.contactID || this.storeContactID();
      localStorage.tags      || this.storeTags();
      localStorage.contacts  || this.storeContacts();

      this.contactID =  JSON.parse(localStorage.contactID);
      this.tags =       JSON.parse(localStorage.tags);
      this.contacts =   JSON.parse(localStorage.contacts);
    },
    bind: function() {
      $form.on('submit', this.createContact.bind(this));
      $form.on('click', 'a', this.cancelAddForm.bind(this));
      $newTag.on('submit', this.createTag.bind(this));
      $manageTagsButton.on('click', this.openTagManagerModal.bind(this));
      $tagManager.on('click', '#deleteTag', this.deleteTags.bind(this));
      $tagManager.on('click', 'a.cancel', this.cancelTagForm.bind(this));
      $list.on('click', '#deleteContact', this.deleteContact.bind(this));
      $list.on('click', '#editContact', this.editContact.bind(this));
      $edit.on('submit', 'form', this.rewriteContactInfo.bind(this));
      $edit.on('click', 'a', this.cancelEditForm.bind(this));
      $tagSearch.on('change', ':checkbox', this.searchTags.bind(this));
      $contactsSearch.on('keyup', 'input', this.search.bind(this));
      $addContactButton.on('click', this.openAddContactModal.bind(this));
    },
    init: function() {
      this.setupLocalStorage();
      this.createTemplates();
      this.addAllTagsToList();
      this.addContactsToList(this.contacts);
      this.setupTagSearch();
      this.bind();

      if (this.contacts.length === 0) {
        this.resetContactID();
      }
    }
  };

  manageContacts.init();
});

const learnCourseList = () => {
  const initCourseList = () => {
    bulkAssignCategories();
    bulkUnassignCategories();
    bulkAssignHashTag();
    bulkCustomFields();
    searchOnClick();
    bulkArchiveCourse();
    bulkUnarchiveCourse();
    editCourseContent();
    initPagination();
    resizeWindowListener();
    dataTableDrawCallback();
    columnSort();
    exportCourseList();
    bulkChangeVisibility();
    bulkEditGovernance();
    scrollToTopBeforeExit();
    maintainSortFiltersOnReload();
  },
    exportCourseList = () => {
      jQuery('#export_course_list')
        .off('click')
        .on('click', (e) => {
          e.stopPropagation();
          e.preventDefault();

          jQuery.ajax({
            url: '/admin/learn/courses/export_course_list_request',
            method: 'POST',
            dataType: 'json',
            success({ success, template }) {
              if (success) {
                jQuery.fancybox({
                  titlePosition: 'outside',
                  transitionIn: 'none',
                  titleShow: false,
                  transitionOut: 'none',
                  autoScale: false,
                  scrolling: false,
                  scrollOutside: true,
                  hideOnOverlayClick: false,
                  enableEscapeButton: false,
                  autoDimensions: false,
                  centerOnScroll: true,
                  autoCenter: true,
                  width: '650',
                  height: 'auto',
                  content: template,
                  onComplete: () => {
                    jQuery.fancybox.center();
                    MangoSpring.applyFancyboxCss(
                      '#fancybox-outer, #fancybox-wrap',
                      'auto',
                      'auto',
                      0,
                    );
                    MangoSpring.applyFancyboxCss(
                      '#fancybox-content',
                      '650px',
                      'auto',
                      0,
                    );
                    jQuery('#fancybox-title').css('display', 'none');
                  },
                });
              }
            },
          });
        });
    },
    enableClicksWithLoader = () => {
      jQuery('html').removeClass('pointer-events-none');
      ES6MangoSpring.trackerModule.tracker().loader('hide');
    },
    disableClicksWithLoader = () => {
      ES6MangoSpring.trackerModule.tracker().loader();
      jQuery('html').addClass('pointer-events-none');
    },
    getSortColumns = () => jQuery('.c-column-sort'),
    maintainSortFiltersOnReload = () => {
      const sortFilterUrl = sessionStorage.getItem('course-sort-filters');

      if (!sortFilterUrl) return;

      // To do:
      // Prevent API call if old and new filter urls are the same

      const activeClass = 'current',
        ascClass = 'sort_asc',
        descClass = 'sort_desc',
        sortColumns = getSortColumns(),
        sortFilterParams = new URLSearchParams(sortFilterUrl),
        selectedCategoryElem = sortColumns.filter(`[data-sort-by=${sortFilterParams.get('sort_by')}]`),
        sortClass = sortFilterParams.get('order') === 'ASC' ? ascClass : descClass;

      jQuery.ajax({
        method: 'GET',
        url: sortFilterUrl,
        beforeSend: disableClicksWithLoader,
        success(res) {
          jQuery('#course-data').html(res);
          dataTableDrawCallback();
          MangoSpring.grabElement('pagination-handler').setAttribute(
            'page',
            '1',
          );
          sortColumns.parent().removeClass(activeClass);
          sortColumns.removeClass(`${ascClass}, ${descClass}`);
          selectedCategoryElem.parent().addClass(activeClass);
          selectedCategoryElem.addClass(sortClass);
          enableClicksWithLoader();
        },
        error() {
          enableClicksWithLoader();
        },
      });
    },
    columnSort = () => {
      getSortColumns()
        .off('click')
        .on('click', (event) => {
          const targetEle = jQuery(event.currentTarget),
            sortValue = MangoSpring.grabElement('column-sort');
          let sortingParam = `sort_by=${targetEle.attr('data-sort-by')}`,
            url = MangoSpring.grabElement('pagination-handler').getAttribute(
              'href',
            );

          if (targetEle.is('.sort_desc, .sort_asc')) {
            if (targetEle.hasClass('sort_desc')) {
              targetEle.removeClass('sort_desc').addClass('sort_asc');
            } else {
              targetEle.removeClass('sort_asc').addClass('sort_desc');
            }
          } else {
            const sortedColumn = jQuery('#course_table_list .current');
            sortedColumn.removeClass('current');
            sortedColumn.find('a').removeClass('sort_desc sort_asc');
            targetEle.parent('th').addClass('current');
            targetEle.addClass('sort_asc');
          }
          if (targetEle.hasClass('sort_asc')) {
            sortingParam = `${sortingParam}&order=ASC`;
          } else {
            sortingParam = `${sortingParam}&order=DESC`;
          }
          sortValue.value = sortingParam;
          url = `${url}&${sortValue.value}`;

          jQuery.ajax({
            method: 'GET',
            url,
            success(res) {
              jQuery('#course-data').html(res);
              dataTableDrawCallback();
              MangoSpring.grabElement('pagination-handler').setAttribute(
                'page',
                '1',
              );
              sessionStorage.setItem('course-sort-filters', url);
            },
          });
        });
    },
    resizeWindowListener = () => {
      jQuery(window)
        .off('resize')
        .on('resize', () => {
          setBulkBarWidth();
        });
    },
    initPagination = () => {
      let ajaxRequestOn = false;

      jQuery(window)
        .off('scroll')
        .on('scroll', () => {
          if (
            jQuery(window).scrollTop() + jQuery(window).height()
            >= jQuery(document).height() - 0.9
          ) {
            if (MangoSpring.grabElement('pagination-handler')) {
              const paginationDataAnchor = MangoSpring.grabElement('pagination-handler'),
                totalPages = parseInt(
                  paginationDataAnchor.getAttribute('total_pages'), 10,
                ),
                currentPage = parseInt(paginationDataAnchor.getAttribute('page'), 10),
                { href } = paginationDataAnchor,
                sortValue = MangoSpring.grabElement('column-sort'),
                nextPage = currentPage + 1;

              if (currentPage >= totalPages) return;

              jQuery('#twit-loader').css('visibility', 'visible');

              let url;
              if (href.split('?').length > 1) {
                url = `${href}&page=${nextPage}`;
              } else {
                url = `${href}?page=${nextPage}`;
              }
              url = `${url}&${sortValue.value}`;

              if (!ajaxRequestOn) {
                jQuery.ajax({
                  method: 'GET',
                  url,
                  beforeSend() {
                    ajaxRequestOn = true;
                    return true;
                  },
                  success(res) {
                    jQuery('#twit-loader').css('visibility', 'hidden');
                    paginationDataAnchor.setAttribute('page', nextPage);
                    jQuery('#course-data').append(res);
                    dataTableDrawCallback();
                    ajaxRequestOn = false;
                  },
                  error(err) {
                    MangoSpring.showGlobalError('Error in processing request');
                    console.log(err);
                    ajaxRequestOn = false;
                  },
                });
              }
            }
          }
          makeBulkSelectBarSticky();
          setBulkBarWidth();
        });
    },
    filterCourses = () => {
      jQuery('a.static-category-filter')
        .off('click')
        .on('click', (event) => {
          const selectedLabel = event.currentTarget.firstElementChild.innerText,
            status = event.currentTarget.getAttribute('data-status'),
            category = document
              .getElementById('cat-label')
              .getAttribute('data-cat-id');

          document
            .querySelectorAll('.static-category-filter')
            .forEach(e => e.classList.remove('selected'));
          event.currentTarget.classList.add('selected');
          jQuery('#course-filter-label').text(selectedLabel);
          document
            .getElementById('course-filter-label')
            .setAttribute('data-status', status);

          jQuery.ajax({
            type: 'GET',
            url: '/admin/learn/courses',
            dataType: 'script',
            data: { status, category },
            success() { },
          });
        });

      jQuery('a.static-category-filter-cat')
        .off('click')
        .on('click', (event) => {
          const selectedLabel = event.currentTarget.firstElementChild.innerText,
            category = event.currentTarget.getAttribute('data-category'),
            status = document
              .getElementById('course-filter-label')
              .getAttribute('data-status');

          document
            .querySelectorAll('.static-category-filter-cat')
            .forEach(e => e.classList.remove('selected'));
          event.currentTarget.classList.add('selected');
          jQuery('#cat-label').text(selectedLabel);
          document
            .getElementById('cat-label')
            .setAttribute('data-cat-id', category);

          jQuery.ajax({
            type: 'GET',
            url: '/admin/learn/courses',
            dataType: 'script',
            data: { category, status },
            success() { },
          });
        });
    },
    editCourseContent = () => {
      jQuery('.edit-course-content')
        .off('click')
        .on('click', (e) => {
          jQuery.ajax({
            type: 'GET',
            url: e.currentTarget.getAttribute('data-href'),
            success({ success, popup_url: popupUrl, redirect_url: redirectUrl }) {
              if (success) {
                MangoSpring.initMangoFancyBox(
                  '',
                  600,
                  popupUrl,
                  () => { },
                );
              } else {
                window.location.href = redirectUrl;
              }
            },
          });
        });
    },
    updateBulkSelectionOnPagination = () => {
      if (parseInt(jQuery('#pagination-handler').attr('page'), 10) !== 1) {
        if (MangoSpring.grabElement('selected-bulk-courses').checked) {
          jQuery('#course-data')
            .find('input:checkbox')
            .attr('checked', 'checked');
          updateBulkSelectCountText(getBulkSelectedCourses().length);
        }
      }
    },
    dataTableDrawCallback = () => {
      courseSelectAction();
      deleteCourse();
      archivedCourse();
      viewOlderVersions();
      editCourseInfo();
      duplicateCourse();
      unarchiveCourse();
      ES6MangoSpring.learnCommonJS().uploadScormCourse();
      ES6MangoSpring.learnCommonJS().versionSettingsTracking();
      publishCurriculum();
      editCourseContent();
      updateBulkSelectionOnPagination();
      mangoPost.manageAutoGovernanceDialog();
    },
    bulkCustomFields = () => {
      jQuery('#bulk_set_custom_fields')
        .off('click')
        .on('click', () => {
          initializeFancybox();
        });
    },
    viewOlderVersions = () => {
      jQuery('.view-older-version')
        .off('click')
        .on('click', (event) => {
          const url = event.target.getAttribute('data-href');
          MangoSpring.initMangoFancyBox('', 600, url, () => { });
        });
    },
    duplicateCourse = () => {
      jQuery('.duplicate-category-popup')
        .off('click')
        .on('click', (event) => {
          const url = event.target.getAttribute('data-href'),
            courseLabel = jQuery('#course_table_list').data('course-label');
          MangoSpring.initMangoFancyBox('', 600, url, () => {
            jQuery('#user-list')
              .off('change')
              .on('click', (ev) => {
                const UsersProgress = MangoSpring.grabClassElements(
                  'users-pregress-wrapper',
                )[0];
                if (ev.currentTarget.checked) {
                  UsersProgress.classList.remove('hide');
                } else {
                  UsersProgress.classList.add('hide');
                  UsersProgress.querySelector(
                    '#users-pregress',
                  ).checked = false;
                }
              });
            jQuery('#submit-duplicate-course')
              .off('click')
              .on('click', () => {
                const form = MangoSpring.grabElement('duplicate-course-form');
                jQuery.ajax({
                  type: form.getAttribute('method'),
                  url: form.getAttribute('action'),
                  dataType: 'JSON',
                  data: form.serialize(),
                  success({ success, errors }) {
                    if (success) {
                      MangoSpring.showGlobalSuccess(`${courseLabel} duplicated successfully.`);
                      jQuery.fancybox.close();
                      Turbolinks.visit(window.location.href);
                    } else {
                      MangoSpring.showGlobalError(errors);
                    }
                  },
                });
              });
          });
        });
    },
    initializeFancybox = () => {
      const url = '/admin/learn/courses/custom_fields_popup',
        width = 600,
        callback = false,
        checkedVal = getBulkSelectedCourseIds();

      jQuery.fancybox({
        width,
        height: 'auto',
        scrolling: 'visible',
        transitionIn: 'none',
        transitionOut: 'none',
        autoDimensions: false,
        padding: '0',
        hideOnOverlayClick: false,
        enableEscapeButton: false,
        href: url,
        onComplete(element) {
          jQuery('#fancybox-content').css({
            width: 554,
            height: 'auto',
            'border-width': 0,
          });
          jQuery('#fancybox-outer').css({
            width: 554,
            height: 'auto',
            border: 0,
          });
          jQuery.fancybox.center(true);
          setTimeout(() => {
            jQuery.fancybox.resize();
            jQuery.fancybox.center(true);
          }, 50);

          mangofileactions.setCustomFileAccess();
          jQuery('#fancybox-content #bulk_course_ids').val(checkedVal.join());
          const saveBtnState = jQuery('#submit_bulk_file_metadata');
          if (
            jQuery(
              '#bulk_file_metadata_form input.filled-in[type=checkbox]:checked',
            ).length > 0
          ) {
            saveBtnState.removeClass('disable-event');
          } else {
            saveBtnState.addClass('disable-event');
          }
          if (
            jQuery('#fancybox-content').find('#submit_bulk_file_metadata')
              .length > 0
          ) {
            mangofileactions.bindBulkMetadataDialog(jQuery(element), callback);
          }
          if (jQuery('.ui-state-disabled').length > 0) {
            jQuery('.ui-state-disabled').removeClass('ui-state-disabled');
          }

          MangoSpring.initIntlPhoneField();
          MangoSpring.ui.SettingsActions.prototype.initFreeFlowingUserTypeAhead();
        },
        onClosed() {
          if (jQuery('body').hasClass('body-scroll')) {
            jQuery('body').removeClass('body-scroll');
          }
        },
        onCleanup() {
          if (jQuery('.dialog_body .metadata_all_assigned').is(':visible')) {
            resetBulkActions();
          }
        },
      });
    },
    bulkAssignHashTag = () => {
      jQuery('#bulk_set_hash_tags')
        .off('click')
        .on('click', () => {
          MangoSpring.initMangoFancyBox(
            '',
            600,
            '/admin/learn/courses/assign_hashtags_popup',
            () => { },
            () => { },
            {
              type: 'POST',
              data: {
                course_ids: getBulkSelectedCourseIds().join(),
              },
            },
          );
        });
    },
    bulkUnassignCategories = () => {
      jQuery('#bulk_unassign_categories')
        .off('click')
        .on('click', () => {
          const checkedCourseIds = getBulkSelectedCourseIds().join();

          MangoSpring.initMangoFancyBox(
            '',
            600,
            '/admin/learn/courses/categories_unassign_popup',
            () => {
              const saveBtn = jQuery('#save_categories'),
                categoryChecks = jQuery('.bulk-category-checkbox');

              saveBtn.addClass('disable-event');

              categoryChecks.off('change').on('change', () => {
                enableButtonOnValidChecks(saveBtn, categoryChecks);
              });

              jQuery('#course_categories_remove')
                .find('.unassign-categories-list-delete')
                .off('click')
                .on('click', (e) => {
                  jQuery(e.target).parent().parent().css('display', 'none');
                });

              saveBtn.off('click').on('click', () => {
                saveBtn.addClass('disable-event');

                jQuery.ajax({
                  url: '/admin/learn/courses/categories_bulk_removal',
                  type: 'POST',
                  dataType: 'json',
                  data: {
                    course_ids: checkedCourseIds,
                    category_ids: getCheckedCategories(categoryChecks).join(),
                  },
                  success({ success }) {
                    if (success) {
                      showSuccessAndReloadOnDelay('Categories unassigned successfully.');
                    } else {
                      MangoSpring.showGlobalError('Can\'t unassign categories.');
                      saveBtn.removeClass('disable-event');
                    }
                  },
                });
              });
            },
            () => { },
            {
              type: 'POST',
              data: {
                course_ids: checkedCourseIds,
              },
            },
          );
        });
    },
    bulkAssignCategories = () => {
      MangoSpring.initMangoFancyBox(
        '#bulk_assign_categories',
        600,
        '/admin/learn/courses/bulk_assign_categories_popup',
        () => {
          const saveBtn = jQuery('#save-assign-category'),
            categoryChecks = jQuery('.bulk-category-checkbox');

          saveBtn.addClass('disable-event');

          categoryChecks.off('change').on('change', () => {
            enableButtonOnValidChecks(saveBtn, categoryChecks);
          });

          saveBtn.off('click').on('click', () => {
            saveBtn.addClass('disable-event');

            jQuery.ajax({
              type: 'POST',
              url: '/admin/learn/courses/bulk_update_categories',
              dataType: 'JSON',
              data: {
                course_ids: getBulkSelectedCourseIds().join(),
                category_ids: getCheckedCategories(categoryChecks).join(),
              },
              success({ success }) {
                if (success) {
                  showSuccessAndReloadOnDelay('Categories have been assigned to courses.');
                } else {
                  MangoSpring.showGlobalError('Can\'t assign categories to courses.');
                  saveBtn.removeClass('disable-event');
                }
              },
            });
          });
        },
      );
    },
    enableButtonOnValidChecks = (btn, chkBoxs) => {
      if (filterChecked(chkBoxs).length) {
        btn.removeClass('disable-event');
      } else {
        btn.addClass('disable-event');
      }
    },
    filterChecked = c => c.filter(':checked'),
    getCheckedCategories = c => Array.from(filterChecked(c)).map(({ value }) => value),
    getBulkSelectedCourses = () => jQuery('#course-data input:checkbox:checked'),
    getCourseLabels = () => {
      const table = jQuery('#course_table_list'),
        label = table.data('course-label'),
        pluralLabel = table.data('course-label-plural');

      return {
        label,
        pluralLabel,
      };
    },
    updateBulkSelectCountText = (checkedCount) => {
      const { label, pluralLabel } = getCourseLabels(),
        courseCountLabel = c => (c === 1 ? label : pluralLabel);

      jQuery('#courses-selected-count').text(checkedCount);
      jQuery('#course-count-noun').text(
        courseCountLabel(checkedCount),
      );
    },
    hideBulkActions = () => jQuery('#bulk_course_actions').hide(),
    courseSelectAction = () => {
      jQuery('#course_table_list')
        .find('input:checkbox')
        .change((e) => {
          const checkedCoursesCount = getBulkSelectedCourses().length,
            bulkActionTopBar = jQuery('#bulk_course_actions'),
            bulkCourseCheckbox = jQuery('#selected-bulk-courses');

          if (checkedCoursesCount === 0) {
            bulkActionTopBar.hide();
          } else {
            bulkActionTopBar.show();
            if (e.target.id === 'all_course_chk') {
              bulkCourseCheckbox.attr('checked', 'checked');
            }
          }

          if (
            MangoSpring.grabElement('course-data').childElementCount
            === checkedCoursesCount
          ) {
            bulkCourseCheckbox.attr('checked', 'checked');
          } else {
            bulkCourseCheckbox.removeAttr('checked');
            jQuery('#all_course_chk').removeAttr('checked');
          }

          updateBulkSelectCountText(checkedCoursesCount);
        });

      jQuery('#deselect_all_courses')
        .off('click')
        .on('click', (e) => {
          e.preventDefault();

          resetBulkActions();
        });

      jQuery('#selected-bulk-courses').change((e) => {
        const {
          target: { checked },
        } = e,
          courseData = jQuery('#course-data'),
          checkBoxes = courseData.find('input:checkbox');

        if (checked) {
          checkBoxes.attr('checked', 'checked');
        } else {
          checkBoxes.removeAttr('checked');
          jQuery('#all_course_chk').removeAttr('checked');
          hideBulkActions();
        }

        updateBulkSelectCountText(getBulkSelectedCourses().length);
      });
    },
    resetBulkActions = () => {
      jQuery('#course_table_list')
        .find('input:checkbox')
        .removeAttr('checked');
      jQuery('#selected-bulk-courses').removeAttr('checked');
      hideBulkActions();
    },
    searchOnClick = () => {
      const searchCont = jQuery('.ma_course_search_container');
      searchCont.off('click').on('click', () => {
        searchCont.addClass('searchExpanded');
        return false;
      });
      jQuery(document)
        .off('click')
        .on('click', () => {
          if (searchCont.hasClass('searchExpanded') === true) {
            searchCont.removeClass('searchExpanded');
          }
        });
    },
    deleteCourse = () => {
      jQuery('.delete-course')
        .off('click')
        .on('click', (e) => {
          const coursePath = e.target.getAttribute('data-href'),
            courseLabel = e.currentTarget.getAttribute('data-course-label'),
            deleteCourseRow = jQuery(e.target).closest('tr').get(0);
          MangoSpring.initMangoFancyBox('', 600, coursePath, () => {
            archivedCourse();
            jQuery('#delete-course-permanently')
              .off()
              .on('click', (ev) => {
                const url = ev.currentTarget.getAttribute('data-href');
                jQuery.ajax({
                  url,
                  method: 'DELETE',
                  success: ({ success }) => {
                    if (success) {
                      deleteCourseRow.remove();
                      MangoSpring.showGlobalSuccess(`${courseLabel} Deleted Successfully`);
                      jQuery.fancybox.close();
                    } else {
                      MangoSpring.showGlobalError(`Unable to delete ${courseLabel}`);
                      jQuery.fancybox.close();
                    }
                  },
                });
              });
            jQuery.fancybox.center(true);
          });
        });
    },
    archivedCourse = () => {
      jQuery('.archived-course')
        .off('click')
        .on('click', (e) => {
          jQuery.fancybox.close();
          const courseLabel = e.currentTarget.getAttribute('data-course-label'),
            msCatsEyeContent = _i18n_bkp(
              `Archiving the ${courseLabel} will remove it from the ${courseLabel} catalog for all users. Once archived users will not be able to take this ${courseLabel}. However users who have already started this ${courseLabel} will still be able to complete it. Are you sure you want to archive the ${courseLabel}?`,
            ),
            courseId = e.target.getAttribute('data-course-id');

          MangoSpring.initMangoConfirmationBox(
            '525',
            _i18n_bkp(`Archive ${courseLabel}`),
            `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
            () => {
              jQuery.ajax({
                url: `/admin/learn/courses/${courseId}/archived`,
                method: 'GET',
                success: ({ success, message }) => {
                  if (success) {
                    MangoSpring.showGlobalSuccess(message);
                    jQuery.fancybox.close();
                    Turbolinks.visit(window.location.href);
                  } else {
                    MangoSpring.showGlobalError(message);
                    jQuery.fancybox.close();
                  }
                },
              });
            },
            () => { },
            {
              yesLabel: _i18n_bkp('Yes, Archive'),
              noLabel: _i18n_bkp('Cancel'),
            },
          );
        });
    },
    unarchiveCourse = () => {
      jQuery('.unarchive-course')
        .off('click')
        .on('click', (e) => {
          const courseLabel = e.currentTarget.getAttribute('data-course-label'),
            msCatsEyeContent = _i18n_bkp(
              `Unarchiving the ${courseLabel} will make it re-appear in the ${courseLabel} catalog. Once unarchived users will be able to take this ${courseLabel}. Are you sure you want to unarchive the ${courseLabel}?`,
            ),
            courseId = e.target.getAttribute('data-course-id');
          MangoSpring.initMangoConfirmationBox(
            '525',
            _i18n_bkp(`Unarchive ${courseLabel}`),
            `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
            () => {
              jQuery.ajax({
                url: `/admin/learn/courses/${courseId}/unarchive`,
                method: 'GET',
                success: ({ success }) => {
                  if (success) {
                    MangoSpring.showGlobalSuccess(`${courseLabel} Unarchive Successfully`);
                    jQuery.fancybox.close();
                    Turbolinks.visit(window.location.href);
                  } else {
                    MangoSpring.showGlobalError(`Unable to Unarchive a ${courseLabel}`);
                    jQuery.fancybox.close();
                  }
                },
              });
            },
            () => { },
            {
              yesLabel: _i18n_bkp('Yes, Unarchive'),
              noLabel: _i18n_bkp('Cancel'),
            },
          );
        });
    },
    bulkArchiveCourse = () => {
      jQuery('#bulk_archive_courses')
        .off('click')
        .on('click', () => {
          const checkedCourse = getBulkSelectedCourseIds(),
            { label, pluralLabel } = getCourseLabels(),
            msCatsEyeContent = _i18n_bkp(
              `Archiving <strong>'${checkedCourse.length} ${(checkedCourse.length === 1 ? label : pluralLabel)}'</strong> will remove them from the ${label} catalog. Once archived, users will not be able to take the ${label}. However users who have already started the ${label}, will still be able to complete it. Are you sure you want to archive them?`,
            );
          MangoSpring.initMangoConfirmationBox(
            '525',
            `${_i18n_bkp('Archive Selected')} ${pluralLabel}`,
            `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
            () => {
              jQuery.ajax({
                url: '/admin/learn/courses/bulk_archive_courses',
                method: 'POST',
                dataType: 'JSON',
                data: { course_ids: checkedCourse.join() },
                success: ({ success }) => {
                  if (success) {
                    MangoSpring.showGlobalSuccess('Courses have been successfully archived');
                    jQuery.fancybox.close();
                    window.location.reload();
                  } else {
                    MangoSpring.showGlobalError('Unable to Archived the Courses');
                    jQuery.fancybox.close();
                  }
                },
              });
            },
            () => { },
            {
              yesLabel: _i18n_bkp('Yes, Archive'),
              noLabel: _i18n_bkp('Cancel'),
            },
          );
        });
    },
    bulkUnarchiveCourse = () => {
      jQuery('#bulk_unarchive_courses')
        .off('click')
        .on('click', () => {
          const checkedCourse = getBulkSelectedCourseIds(),
            { label, pluralLabel } = getCourseLabels(),
            msCatsEyeContent = _i18n_bkp(
              `Unarchiving <strong>'${checkedCourse.length} ${(checkedCourse.length === 1 ? label : pluralLabel)}'</strong> will make them available in the ${label} catalog. Once unarchived, users will be able to view & take the ${pluralLabel}. Are you sure you want to unarchive them?`,
            );

          MangoSpring.initMangoConfirmationBox(
            '525',
            `${_i18n_bkp('Unarchive Selected')} ${pluralLabel}`,
            `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
            () => {
              jQuery.ajax({
                url: '/admin/learn/courses/bulk_unarchive_courses',
                method: 'POST',
                dataType: 'JSON',
                data: { course_ids: checkedCourse.join() },
                success: ({ success }) => {
                  if (success) {
                    MangoSpring.showGlobalSuccess(`${pluralLabel} have been successfully unarchived`);
                    jQuery.fancybox.close();
                    window.location.reload();
                  } else {
                    MangoSpring.showGlobalError(`Unable to Unarchive the ${pluralLabel}`);
                    jQuery.fancybox.close();
                  }
                },
              });
            },
            () => { },
            {
              yesLabel: _i18n_bkp('Yes, Unarchive'),
              noLabel: _i18n_bkp('Cancel'),
            },
          );
        });
    },
    editCourseInfo = () => {
      jQuery('.edit-course-info')
        .off('click')
        .on('click', (e) => {
          const redirectLoc = e.target.getAttribute('data-href');
          window.location.href = redirectLoc;
        });
    },
    publishCurriculum = () => {
      jQuery('.curriculum-publish-anchor')
        .off('click')
        .on('click', (e) => {
          const url = e.target.getAttribute('data-href'),
            curriculumLabel = jQuery('#course_table_list').data('curriculum-label');

          jQuery.ajax({
            url,
            method: 'PUT',
            success: ({ success }) => {
              if (success) {
                MangoSpring.showGlobalSuccess(`${curriculumLabel} Published Successfully`);
                jQuery.fancybox.close();
                Turbolinks.visit(window.location.href);
              } else {
                MangoSpring.showGlobalError(`Unable to Publish  ${curriculumLabel}`);
                jQuery.fancybox.close();
              }
            },
          });
        });
    },
    getTopnavsHeight = () => jQuery('#ms-main-nav').height() + (jQuery('.people-top-action.top-action-fixed').height() || 0),
    makeBulkSelectBarSticky = () => {
      const actionBar = jQuery('.action_bar_opt'),
        coursesTableTop = MangoSpring.grabElement('course_data').getBoundingClientRect().top;

      if (coursesTableTop < getTopnavsHeight()) {
        actionBar.addClass('is-sticky');
      } else {
        actionBar.removeClass('is-sticky');
      }
    },
    setBulkBarWidth = () => {
      const actionBar = jQuery('.action_bar_opt'),
        parentWidth = actionBar.parent().width();

      if (actionBar.hasClass('is-sticky')) {
        actionBar.width(parentWidth);
      } else {
        actionBar.css({ width: '' });
      }
    },
    getBulkSelectedCourseIds = () => Array.from(getBulkSelectedCourses()).map(el => el.getAttribute('data-course-id')),
    bulkChangeVisibility = () => {
      MangoSpring.initMangoFancyBox(
        '#bulk-edit-visibility',
        480,
        '/admin/learn/courses/bulk_change_course_visibility_popup',
        () => {
          const searchFilters = Object.create(ES6MangoSpring.maSearch);
          searchFilters.init('ma_people_filter_container');

          ES6MangoSpring.learnCourse().initVisibilitySelection();

          jQuery('#save-course-visibility')
            .off('click')
            .on('click', () => {
              const checkedCourse = getBulkSelectedCourseIds(),
                courseCount = checkedCourse.length,
                { label, pluralLabel } = getCourseLabels(),
                scope = MangoSpring.grabElement('rule_scope').value,
                scopeIds = MangoSpring.grabElement('course-rule-auto').value,
                userCriteria = [],
                visibilityText = jQuery('#rule_scope option:selected').text();

              jQuery('.ma_inputBubbleList > li').each(function () {
                const specificCriteria = {
                  data_class: jQuery(this).attr('data_class'),
                  data_id: jQuery(this).attr('data_id'),
                  data_type: jQuery(this).attr('data_type'),
                  entity_id: jQuery(this).attr('entity_id'),
                  data_key: jQuery(this).attr('data_key'),
                  data_label: jQuery(this).attr('data_label'),
                  selected_criteria: jQuery(this).attr('selected_criteria'),
                  selected_value: jQuery(this).attr('selected_value'),
                  entity_sub_id: jQuery(this).attr('entity_sub_id'),
                };
                userCriteria.push(specificCriteria);
              });

              const data = {
                course_ids: checkedCourse.join(),
                scope,
                scope_ids: scopeIds,
                user_specific_criteria: JSON.stringify(userCriteria),
              },
                msCatsEyeContent = _i18n_bkp(
                  `Are you sure you want to change the visibility of <strong>'${courseCount} ${courseCount === 1 ? label : pluralLabel}'</strong> to <strong>'${visibilityText}'</strong>?`,
                );
              MangoSpring.initMangoConfirmationBox(
                435,
                _i18n_bkp('Confirmation'),
                `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
                () => {
                  jQuery.ajax({
                    url: '/admin/learn/courses/bulk_visibility_change',
                    method: 'POST',
                    dataType: 'JSON',
                    data,
                    success: ({ success }) => {
                      if (success) {
                        MangoSpring.showGlobalSuccess(`New visibility settings have been set for the selected ${pluralLabel}`);
                        jQuery.fancybox.close();
                        window.location.reload();
                      } else {
                        MangoSpring.showGlobalError(`Unable to change the visibility of ${pluralLabel}`);
                        jQuery.fancybox.close();
                      }
                    },
                  });
                },
                () => { },
                {
                  yesLabel: _i18n_bkp("Yes, I'm Sure"),
                  noLabel: _i18n_bkp('Cancel'),
                },
              );
            });
        },
      );
    },
    bulkEditGovernance = () => {
      MangoSpring.initMangoFancyBox(
        '#bulk-edit-governance',
        600,
        '/admin/learn/courses/bulk_edit_course_governance_popup',
        () => {
          bindDatePickers();
          toggleArchiveSpecificDate();
          resetToAdminDefault();
          jQuery('#governance-item-enable-checkbox')
            .off('change')
            .on('change', ({ target: { checked } }) => {
              const advancedOptions = jQuery('#governance-advanced-options'),
                enableAutoGovernance = jQuery('#enable-auto-governance');

              if (checked) {
                enableAutoGovernance.val(1);
                advancedOptions.show();
              } else {
                enableAutoGovernance.val(0);
                advancedOptions.hide();
              }
            });

          jQuery('.advance-gov-btn-post')
            .off('click')
            .on('click', ({ currentTarget }) => {
              const collapsibleSection = jQuery('.auto-gov-collapsible-content'),
                dropIcon = currentTarget.getElementsByTagName('i')[0],
                upClass = 'fa-chevron-up',
                downClass = 'fa-chevron-down';

              if (dropIcon.classList.contains(downClass)) {
                dropIcon.classList.remove(downClass);
                dropIcon.classList.add(upClass);
              } else {
                dropIcon.classList.remove(upClass);
                dropIcon.classList.add(downClass);
              }

              collapsibleSection.slideToggle();
            });

          jQuery('#select-bulk-rule-type')
            .off('change')
            .on('change', ({ currentTarget: { value } }) => {
              toggleArchiveSpecificDate();
            });

          jQuery('#select-bulk-time-type')
            .off('change')
            .on('change', ({ currentTarget: { value } }) => {
              toggleArchiveSpecificDate();
            });

          jQuery('#confirm-bulk-governance')
            .off('click')
            .on('click', () => {
              const bulkGovernanceForm = jQuery('#bulk-edit-course-governance-form'),
                msCatsEyeContent = `${_i18n_bkp('This will set the governance rule for all the selected courses(except draft courses if any) as')} <strong>'${governanceConfirmationMessage()}'</strong>. Are you sure?`;

              MangoSpring.initMangoConfirmationBox(
                435,
                _i18n_bkp('Confirmation'),
                `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
                () => {
                  jQuery.ajax({
                    url: '/admin/governance_items',
                    method: 'POST',
                    data: bulkGovernanceForm.serialize(),
                    success: (res) => {
                      jQuery.globalEval(res);
                      reloadOnTimeout();
                    },
                    error: (err) => {
                      jQuery.globalEval(err);
                      reloadOnTimeout();
                    },
                  });
                },
                () => { },
                {
                  yesLabel: _i18n_bkp("Yes, I'm Sure"),
                  noLabel: _i18n_bkp('Cancel'),
                },
                () => {
                  bulkGovernanceForm.find('[name="governance[item_ids]"]').val(getBulkSelectedCourseIds().join());
                },
              );
            });
        },
      );
    },
    governanceConfirmationMessage = () => {
      const selectedRuleType = jQuery('#select-bulk-rule-type option:checked').text().trim(),
        selectedDuration = jQuery('#select-bulk-period option:checked').text().trim(),
        ruleLabel = jQuery('#governance-rule-label').text().trim(),
        isArchivedOnDate = jQuery('#select-bulk-rule-type').val() == 'to_be_archived' && jQuery('#select-bulk-time-type').val() == 'on';
      if (isArchivedOnDate) {
        return `${selectedRuleType} ${_i18n_bkp('On')} ${jQuery('#govArchiveSpecificDate').val()}`;
      }
      return `${selectedRuleType} ${_i18n_bkp('After')} ${selectedDuration} ${ruleLabel}`;
    },
    toggleArchiveSpecificDate = () => {
      const ruleType = jQuery('#select-bulk-rule-type'),
        timeType = jQuery('#select-bulk-time-type'),
        govAfterWorkflow = jQuery('.bulk-gov-after-workflow'),
        govOnWorkflow = jQuery('.bulk-gov-on-workflow'),
        govArchiveSpecificDate = jQuery('#govArchiveSpecificDate'),
        label = jQuery('#governance-rule-label'),
        afterLabel = jQuery('#after-label');

      if (ruleType.val() === 'to_be_archived') {
        timeType.show();
        afterLabel.hide();
        label.html(label.data('creation-label'));
      } else {
        timeType.val('after');
        timeType.hide();
        afterLabel.show();
        label.html(label.data('review-label'));
      }
      if (timeType.val() === 'on') {
        govAfterWorkflow.hide();
        govOnWorkflow.show();
      } else {
        govAfterWorkflow.show();
        govOnWorkflow.hide();
      }
      updateBulkArchiveLabel();
    },
    bindDatePickers = () => {
      const govArchiveSpecificDate = jQuery('#govArchiveSpecificDate');
      govArchiveSpecificDate.datepicker({
        dateFormat: converted_date_format,
        altField: '#govArchiveSpecificDate_hidden',
        altFormat: 'dd/mm/yy',
        showAnim: '',
        duration: 0,
        closeText: _i18n_bkp('Clear'),
        yearRange: '-100:+50',
        showButtonPanel: true,
        changeMonth: true,
        changeYear: true,
        minDate: 0,
        onSelect(dateText, inst) {
          updateBulkArchiveLabel();
        },
      });
      if (!govArchiveSpecificDate.val()) {
        const dateToSet = moment().add(7, 'days').toDate();
        govArchiveSpecificDate.datepicker('setDate', dateToSet);
      }
    },
    updateBulkArchiveLabel = () => {
      const ruleType = jQuery('#select-bulk-rule-type option:selected'),
        timeType = jQuery('#select-bulk-time-type option:selected'),
        ruleTypeText = ruleType.data('ruleTypeText'),
        ruleTypeTitle = ruleType.data('ruleTypeTitle');
      let updatedDate = jQuery(
        '#governance_governance_item_execution_interval option:selected',
      ).data('calculatedInterval');
      jQuery('#governance-rule-label').text(ruleTypeTitle);
      if (ruleType.get(0).value === 'to_be_archived' && timeType.get(0).value === 'on') {
        updatedDate = jQuery('#govArchiveSpecificDate').val();
        jQuery('#governance-rule-label').text('');
      }

      jQuery('#governance-updated-due-date')
        .text(`${ruleTypeText}: ${updatedDate}`)
        .show();
    },
    resetToAdminDefault = () => {
      jQuery('#bulk-governance-reset-to-default').on('click', () => {
        const resetLink = jQuery('#bulk-governance-reset-to-default'),
          governableType = resetLink.data('governance_rule_type'),
          interval = resetLink.data('governance_execution_interval'),
          timeType = resetLink.data('governance_time_type');
        jQuery('#governance_reset_to_default').val('true');
        jQuery('#select-bulk-rule-type').val(governableType).trigger('change');
        jQuery('#select-bulk-period').val(interval);
        jQuery('#select-bulk-time-type').val(timeType).trigger('change');
      });
    },
    scrollToTopBeforeExit = () => {
      window.addEventListener('beforeunload', scrollToTop, false);
    },
    scrollToTop = () => {
      window.scrollTo(0, 0);
    },
    reloadOnTimeout = (t = 2000) => {
      setTimeout(() => {
        window.location.reload();
      }, t);
    },
    showSuccessAndReloadOnDelay = (s = '') => {
      jQuery.fancybox.close();
      MangoSpring.showGlobalSuccess(s);
      reloadOnTimeout();
    };

  return {
    initCourseList,
    filterCourses,
    initPagination,
    resetBulkActions,
    hideBulkActions,
  };
};

export default learnCourseList;

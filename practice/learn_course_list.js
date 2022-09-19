const learnCourseList = () => {
  const initCourseList = () => {
    bulkAssignCategories();
    bulkUnassignCategories();
    bulkAssignHashTag();
    bulkCustomFields();
    searchOnClick();
    bulkArchivedCourse();
    bulkUnArchivedCourse();
    editCourseContent();
    initPagination();
    dataTableDrawCallback();
    columnSort();
    exportCourseList();
  },

    exportCourseList = () => {
      jQuery('#export_course_list')
        .off('click')
        .on('click', (event) => {
          event.stopPropagation();
          event.preventDefault();

          jQuery.ajax({
            url: `/admin/learn/courses/export_course_list_request`,
            method: 'POST',
            dataType: 'json',
            success(response) {
              if (response.success) {
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
                  width: "650",
                  height: 'auto',
                  content: response.template,
                  onComplete: () => {
                    jQuery.fancybox.center();
                    MangoSpring.applyFancyboxCss('#fancybox-outer, #fancybox-wrap', 'auto', 'auto', 0);
                    MangoSpring.applyFancyboxCss('#fancybox-content', '650px', 'auto', 0);
                    jQuery('#fancybox-title').css('display', 'none');
                  },
                });
              }
            }
          });
        });
    },
    columnSort = () => {
      jQuery('.c-column-sort')
        .off('click')
        .on('click', (event) => {
          const targetEle = jQuery(event.currentTarget),
            sortValue = MangoSpring.grabElement('column-sort');
          let sortingParam = `sort_by=${targetEle.attr('data-sort-by')}`,
            url = MangoSpring.grabElement('pagination-handler').getAttribute(
              'href'
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
            success(response) {
              jQuery('#course-data').html(response);
              dataTableDrawCallback();
              MangoSpring.grabElement('pagination-handler').setAttribute(
                'page',
                '1'
              );
            },
          });
        });
    },
    initPagination = () => {
      jQuery(window)
        .off('scroll')
        .on('scroll', () => {
          if (
            jQuery(window).scrollTop() + jQuery(window).height()
            >= jQuery(document).height() - 0.9
          ) {
            if (MangoSpring.grabElement('pagination-handler')) {
              const paginationDataAnchor = MangoSpring.grabElement(
                'pagination-handler'
              ),
                totalPages = Number(
                  paginationDataAnchor.getAttribute('total_pages')
                ),
                currentPage = Number(paginationDataAnchor.getAttribute('page')),
                { href, } = paginationDataAnchor,
                sortValue = MangoSpring.grabElement('column-sort');
              let url;

              if (currentPage + 1 > totalPages) {
                return;
              }
              jQuery('#twit-loader').css('visibility', 'visible');

              if (href.split('?').length > 1) {
                url = `${href}&page=${currentPage + 1}`;
              } else {
                url = `${href}?page=${currentPage + 1}`;
              }
              url = `${url}&${sortValue.value}`;

              jQuery.ajax({
                method: 'GET',
                url,
                success(response) {
                  jQuery('#twit-loader').css('visibility', 'hidden');
                  paginationDataAnchor.setAttribute('page', currentPage + 1);
                  jQuery('#course-data').append(response);
                  dataTableDrawCallback();
                },
              });
            }
          }
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
            data: { status, category, },
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
            data: { category, status, },
            success() { },
          });
        });
    },
    editCourseContent = () => {
      jQuery('.edit-course-content')
        .off('click')
        .on('click', (event) => {
          jQuery.ajax({
            type: 'GET',
            url: event.currentTarget.getAttribute('data-href'),
            success(resp) {
              if (resp.success) {
                MangoSpring.initMangoFancyBox(
                  '',
                  600,
                  resp.popup_url,
                  () => { }
                );
              } else {
                window.location.href = resp.redirect_url;
              }
            },
          });
        });
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
              .on('click', (event) => {
                const UsersProgress = MangoSpring.grabClassElements(
                  'users-pregress-wrapper'
                )[0];
                if (event.currentTarget.checked) {
                  UsersProgress.classList.remove('hide');
                } else {
                  UsersProgress.classList.add('hide');
                  UsersProgress.querySelector(
                    '#users-pregress'
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
                  success(resp) {
                    if (resp.success) {
                      jQuery('#notice')
                        .html(
                          `${courseLabel} duplicated successfully. <a class="close">x</a>`
                        )
                        .show();
                      hideNotice('#notice');
                      jQuery.fancybox.close();
                      Turbolinks.visit(window.location.href);
                    } else {
                      jQuery('#error')
                        .html(`${resp.errors} <a class="close">x</a>`)
                        .show();
                      hideNotice('#error');
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
        checkedVal = [];

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

          jQuery('#course_table_list input:checkbox').each(function () {
            this.checked ? checkedVal.push(jQuery(this).data('course-id')) : '';
          });

          mangofileactions.setCustomFileAccess();
          jQuery('#fancybox-content #bulk_course_ids').val(checkedVal.join());
          const saveBtnState = jQuery('#submit_bulk_file_metadata');
          if (
            jQuery(
              '#bulk_file_metadata_form input.filled-in[type=checkbox]:checked'
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
      });
    },
    bulkAssignHashTag = () => {
      jQuery('#bulk_set_hash_tags')
        .off('click')
        .on('click', () => {
          const checkedVal = [];
          jQuery('#course_table_list input:checkbox').each(function () {
            this.checked ? checkedVal.push(jQuery(this).data('course-id')) : '';
          });
          MangoSpring.initMangoFancyBox(
            '',
            600,
            `/admin/learn/courses/assign_hashtags_popup?course_ids=${checkedVal.join()}`,
            () => { }
          );
        });
    },
    bulkUnassignCategories = () => {
      jQuery('#bulk_unassign_categories')
        .off('click')
        .on('click', () => {
          const checkedVal = [];
          jQuery('#course_table_list input:checkbox').each(function () {
            this.checked ? checkedVal.push(jQuery(this).data('course-id')) : '';
          });
          MangoSpring.initMangoFancyBox(
            '',
            600,
            `/admin/learn/courses/categories_unassign_popup?course_ids=${checkedVal.join()}`,
            () => {
              jQuery('#course_categories_remove')
                .find('.unassign-categories-list-delete')
                .off('click')
                .on('click', (event) => {
                  jQuery(event.target).parent().parent().css('display', 'none');
                });

              jQuery('#save_categories').click(() => {
                const checkedCategory = [];
                jQuery('#unassign-course-cat-popup-bulk input:checkbox').each(
                  function () {
                    this.checked
                      ? checkedCategory.push(jQuery(this).val())
                      : '';
                  }
                );
                jQuery.ajax({
                  url: '/admin/learn/courses/categories_bulk_removal',
                  type: 'POST',
                  dataType: 'json',
                  data: {
                    course_ids: checkedVal.join(),
                    category_ids: checkedCategory.join(),
                  },
                  success(resp) {
                    if (resp.success) {
                      jQuery('#notice')
                        .html(
                          "Categories unassigned successfully.<a href='#' class='close'>x</a>"
                        )
                        .show();
                      hideNotice('#notice');
                      jQuery.fancybox.close();
                      window.location.reload();
                    } else {
                      jQuery('#error')
                        .html(
                          'Can\'t unassigned categories. <a class="close">x</a>'
                        )
                        .show();
                      hideNotice('#error');
                    }
                  },
                });
              });
            }
          );
        });
    },
    bulkAssignCategories = () => {
      MangoSpring.initMangoFancyBox(
        '#bulk_assign_categories',
        600,
        '/admin/learn/courses/bulk_assign_categories_popup',
        () => {
          jQuery('#save-assign-category')
            .off('click')
            .on('click', () => {
              const checkedCategory = [],
                checkedCourse = [];
              jQuery('#assign-course-cat-popup-bulk input:checkbox').each(
                function () {
                  this.checked ? checkedCategory.push(jQuery(this).val()) : '';
                }
              );

              jQuery('#course_table_list input:checkbox').each(function () {
                this.checked
                  ? checkedCourse.push(jQuery(this).data('course-id'))
                  : '';
              });

              jQuery.ajax({
                type: 'POST',
                url: '/admin/learn/courses/bulk_update_categories',
                dataType: 'JSON',
                data: {
                  course_ids: checkedCourse.join(),
                  category_ids: checkedCategory.join(),
                },
                success(resp) {
                  if (resp.success) {
                    jQuery('#notice')
                      .html(
                        'Categories have been assigned to courses. <a class="close">x</a>'
                      )
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                    window.location.reload();
                  } else {
                    jQuery('#error')
                      .html(
                        'Can\'t assign categories to courses. <a class="close">x</a>'
                      )
                      .show();
                    hideNotice('#error');
                  }
                },
              });
            });
        }
      );
    },
    courseSelectAction = () => {
      jQuery('#course_table_list')
        .find('input:checkbox')
        .change(() => {
          const checkedCourses = jQuery('#course_table_list').find(
            'input:checkbox:checked'
          ).length,
            courseTypeFilter = jQuery('#course_type_filter').data('filter-val');

          if (checkedCourses > 0) {
            jQuery('#bulk_course_actions').show();
          } else jQuery('#bulk_course_actions').hide();

          // For bulk Archive/Unarchive courses
          if (courseTypeFilter === 'active') {
            jQuery('#bulk_archive_courses')
              .show()
              .siblings('a#bulk_unarchive_courses')
              .hide();
          } else if (courseTypeFilter === 'archived') {
            jQuery('#bulk_unarchive_courses')
              .show()
              .siblings('a#bulk_archive_courses')
              .hide();
          } else {
            jQuery('#bulk_unarchive_courses, #bulk_archive_courses').hide();
          }
        });
      jQuery('#deselect_all_courses, #clear_all')
        .off('click')
        .on('click', (e) => {
          e.preventDefault();
          jQuery('#course_table_list')
            .find('input:checkbox')
            .removeAttr('checked');
          jQuery('#bulk_course_actions').hide();
        });
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
        .on('click', (event) => {
          const coursePath = event.target.getAttribute('data-href'),
            courseLabel = event.currentTarget.getAttribute('data-course-label'),
            deleteCourseRow = jQuery(event.target).closest('tr').get(0);
          MangoSpring.initMangoFancyBox('', 600, coursePath, () => {
            archivedCourse();
            jQuery('#delete-course-permanently')
              .off()
              .on('click', (event) => {
                const url = event.currentTarget.getAttribute('data-href');
                jQuery.ajax({
                  url,
                  method: 'DELETE',
                  success: (response) => {
                    if (response.success) {
                      deleteCourseRow.remove();
                      jQuery('#notice')
                        .html(
                          `${courseLabel} Deleted Successfully <a class="close">x</a>`
                        )
                        .show();
                      hideNotice('#notice');
                      jQuery.fancybox.close();
                    } else {
                      jQuery('#error')
                        .html(
                          `Unable to delete ${courseLabel} <a class="close">x</a>`
                        )
                        .show();
                      hideNotice('#error');
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
        .on('click', (event) => {
          jQuery.fancybox.close();
          const courseLabel = event.currentTarget.getAttribute(
            'data-course-label'
          ),
            msCatsEyeContent = _i18n_bkp(
              `Archiving the ${courseLabel} will remove it from the ${courseLabel} catalog for all users. Once archived users will not be able to take this ${courseLabel}. However users who have already started this ${courseLabel} will still be able to complete it. Are you sure you want to archive the ${courseLabel}?`
            ),
            courseId = event.target.getAttribute('data-course-id');

          MangoSpring.initMangoConfirmationBox(
            '525',
            _i18n_bkp(`Archive ${courseLabel}`),
            `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
            () => {
              jQuery.ajax({
                url: `/admin/learn/courses/${courseId}/archived`,
                method: 'GET',
                success: (response) => {
                  if (response.success) {
                    jQuery('#notice')
                      .html(`${response.message} <a class="close">x</a>`)
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                    Turbolinks.visit(window.location.href);
                  } else {
                    jQuery('#notice')
                      .html(`${response.message} <a class="close">x</a>`)
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                  }
                },
              });
            },
            () => { },
            {
              yesLabel: _i18n_bkp('Yes, Archive'),
              noLabel: _i18n_bkp('Cancel'),
            }
          );
        });
    },
    unarchiveCourse = () => {
      jQuery('.unarchive-course')
        .off('click')
        .on('click', (event) => {
          const courseLabel = event.currentTarget.getAttribute(
            'data-course-label'
          ),
            msCatsEyeContent = _i18n_bkp(
              `Unarchiving the ${courseLabel} will make it re-appear in the ${courseLabel} catalog. Once unarchived users will be able to take this ${courseLabel}. Are you sure you want to unarchive the ${courseLabel}?`
            ),
            courseId = event.target.getAttribute('data-course-id');
          MangoSpring.initMangoConfirmationBox(
            '525',
            _i18n_bkp(`UnArchive ${courseLabel}`),
            `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
            () => {
              jQuery.ajax({
                url: `/admin/learn/courses/${courseId}/unarchive`,
                method: 'GET',
                success: (response) => {
                  if (response.success) {
                    jQuery('#notice')
                      .html(
                        `${courseLabel} UnArchive Successfully'<a class="close">x</a>`
                      )
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                    Turbolinks.visit(window.location.href);
                  } else {
                    jQuery('#notice')
                      .html(
                        `Unable to UnArchive a ${courseLabel} <a class="close">x</a>`
                      )
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                  }
                },
              });
            },
            () => { },
            {
              yesLabel: _i18n_bkp('Yes, UnArchive'),
              noLabel: _i18n_bkp('Cancel'),
            }
          );
        });
    },
    bulkArchivedCourse = () => {
      jQuery('#bulk_archive_courses')
        .off('click')
        .on('click', () => {
          const msCatsEyeContent = _i18n_bkp(
            'Archiving the selected courses will remove them from the course catalog for all users. Once archived, users will not be able to take these courses. However users who have already started one of these courses will still be able to complete it. Are you sure you want to archive the selected courses?'
          ),
            checkedCourse = [];
          jQuery('#course_table_list input:checkbox').each(function () {
            this.checked
              ? checkedCourse.push(jQuery(this).data('course-id'))
              : '';
          });
          MangoSpring.initMangoConfirmationBox(
            '525',
            _i18n_bkp('Archive Selected Courses'),
            `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
            () => {
              jQuery.ajax({
                url: '/admin/learn/courses/bulk_archive_courses',
                method: 'POST',
                dataType: 'JSON',
                data: { course_ids: checkedCourse.join(), },
                success: (response) => {
                  if (response.success) {
                    jQuery('#notice')
                      .html(
                        `${'Selected Courses Archived Successfully'}<a class="close">x</a>`
                      )
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                    window.location.reload();
                  } else {
                    jQuery('#notice')
                      .html(
                        'Unable to Archived the Courses <a class="close">x</a>'
                      )
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                  }
                },
              });
            },
            () => { },
            {
              yesLabel: _i18n_bkp('Archive Selected Courses'),
              noLabel: _i18n_bkp('Cancel'),
            }
          );
        });
    },
    bulkUnArchivedCourse = () => {
      jQuery('#bulk_unarchive_courses')
        .off('click')
        .on('click', () => {
          const msCatsEyeContent = _i18n_bkp(
            'Unarchiving the selected courses will make them re-appear in the course catalog for all users. Once unarchived, users will be able to take these courses. Are you sure you want to unarchive the selected courses?'
          ),
            checkedCourse = [];
          jQuery('#course_table_list input:checkbox').each(function () {
            this.checked
              ? checkedCourse.push(jQuery(this).data('course-id'))
              : '';
          });
          MangoSpring.initMangoConfirmationBox(
            '525',
            _i18n_bkp('Unarchive Selected Courses'),
            `<p style="font-family:arial,sans-serif,lucida grande,tahoma,verdana;padding:0px;">${msCatsEyeContent}</p>`,
            () => {
              jQuery.ajax({
                url: '/admin/learn/courses/bulk_unarchive_courses',
                method: 'POST',
                dataType: 'JSON',
                data: { course_ids: checkedCourse.join(), },
                success: (response) => {
                  if (response.success) {
                    jQuery('#notice')
                      .html(
                        `${'Selected Courses Unarchived Successfully'}<a class="close">x</a>`
                      )
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                    window.location.reload();
                  } else {
                    jQuery('#notice')
                      .html(
                        'Unable to Unarchive the Courses <a class="close">x</a>'
                      )
                      .show();
                    hideNotice('#notice');
                    jQuery.fancybox.close();
                  }
                },
              });
            },
            () => { },
            {
              yesLabel: _i18n_bkp('Unarchive Selected Courses'),
              noLabel: _i18n_bkp('Cancel'),
            }
          );
        });
    },
    editCourseInfo = () => {
      jQuery('.edit-course-info')
        .off('click')
        .on('click', (event) => {
          const redirectLoc = event.target.getAttribute('data-href');
          window.location.href = redirectLoc;
        });
    },
    publishCurriculum = () => {
      jQuery('.curriculum-publish-anchor')
        .off('click')
        .on('click', (event) => {
          const url = event.target.getAttribute('data-href'),
            curriculumLabel = jQuery('#course_table_list').data(
              'curriculum-label'
            );

          jQuery.ajax({
            url,
            method: 'PUT',
            success: (response) => {
              if (response.success) {
                jQuery('#notice')
                  .html(
                    `${curriculumLabel} Published Successfully'<a class="close">x</a>`
                  )
                  .show();
                hideNotice('#notice');
                jQuery.fancybox.close();
                Turbolinks.visit(window.location.href);
              } else {
                jQuery('#notice')
                  .html(
                    `Unable to Publish  ${curriculumLabel} <a class="close">x</a>`
                  )
                  .show();
                hideNotice('#notice');
                jQuery.fancybox.close();
              }
            },
          });
        });
    };

  return {
    initCourseList,
    filterCourses,
    initPagination,
  };
};

export default learnCourseList;

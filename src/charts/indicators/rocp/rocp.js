/**
 * Created by arnab on 3/1/15.
 */

define(["jquery", "jquery-ui", 'color-picker', 'ddslick'], function ($) {

    var before_add_callback = null;

    function closeDialog() {
        $(this).dialog("close");
        $(this).find("*").removeClass('ui-state-error');
    }

    function init(containerIDWithHash, _callback) {

        require(['css!charts/indicators/rocp/rocp.css']);

        var Level = function (level, stroke, strokeWidth, dashStyle) {
            this.level = level;
            this.stroke = stroke;
            this.strokeWidth = strokeWidth;
            this.dashStyle = dashStyle;
        };
        var defaultLevels = [];

        require(['text!charts/indicators/rocp/rocp.html', 'text!charts/indicators/indicators.json'], function ($html, data) {

            var defaultStrokeColor = '#cd0a0a';

            $html = $($html);
            //$html.hide();
            $html.appendTo("body");

            data = JSON.parse(data);
            var current_indicator_data = data.rocp;
            $html.attr('title', current_indicator_data.long_display_name);
            $html.find('.rocp-description').html(current_indicator_data.description);

            $html.find("input[type='button']").button();

            $html.find("#rocp_stroke").colorpicker({
				showOn: 'click',
                position: {
                    at: "right+100 bottom",
                    of: "element",
                    collision: "fit"
                },
                part: {
                    map: { size: 128 },
                    bar: { size: 128 }
                },
                select: function (event, color) {
                    $("#rocp_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                },
                ok: function (event, color) {
                    $("#rocp_stroke").css({
                        background: '#' + color.formatted
                    }).val('');
                    defaultStrokeColor = '#' + color.formatted;
                }
            });

            var selectedDashStyle = "Solid";
            $('#rocp_dashStyle').ddslick({
                imagePosition: "left",
                width: 148,
                background: "white",
                onSelected: function (data) {
                    $('#rocp_dashStyle .dd-selected-image').css('max-width', '115px');
                    selectedDashStyle = data.selectedData.value
                }
            });
            $('#rocp_dashStyle .dd-option-image').css('max-width', '115px');

            var table = $html.find('#rocp_levels').DataTable({
                paging: false,
                scrollY: 100,
                autoWidth: true,
                searching: false,
                info: false,
                "columnDefs": [
                   { className: "dt-center", "targets": [0, 1, 2, 3] }
                ],
                "aoColumnDefs": [{ "bSortable": false, "aTargets": [1, 3] }]
            });
            $.each(defaultLevels, function (index, value) {
                $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth,
                    '<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/' + value.dashStyle + '.svg" /></div>']).draw().node())
                    .data("level", value)
                    .on('click', function () {
                        $(this).toggleClass('selected');
                    });
            });
            $html.find('#rocp_level_delete').click(function () {
                if (table.rows('.selected').indexes().length <= 0) {
                    require(["jquery", "jquery-growl"], function ($) {
                        $.growl.error({ message: "Select level(s) to delete!" });
                    });
                } else {
                    table.rows('.selected').remove().draw();
                }
            });
            $html.find('#rocp_level_add').click(function () {
                require(["indicator_levels"], function (rocp_level) {
                    rocp_level.open(containerIDWithHash, function (levels) {
                        $.each(levels, function (ind, value) {
                            $(table.row.add([value.level, '<div style="background-color: ' + value.stroke + ';width:100%;height:20px;"></div>', value.strokeWidth,
                                '<div style="width:50px;overflow:hidden;"><img src="images/dashstyle/' + value.dashStyle + '.svg" /></div>']).draw().node())
                                .data("level", value)
                                .on('click', function () {
                                    $(this).toggleClass('selected');
                                });
                        });
                    });
                });
            });


            $html.dialog({
                autoOpen: false,
                resizable: false,
                width: 350,
                height: 400,
                modal: true,
                my: 'center',
                at: 'center',
                of: window,
                dialogClass: 'rocp-ui-dialog',
                buttons: [
                    {
                        text: "OK",
                        click: function () {
                            var $elem = $(".rocp_input_width_for_period");
                            if (!_.isInteger(_.toNumber($elem.val())) || !_.inRange($elem.val(),
                                            parseInt($elem.attr("min")),
                                            parseInt($elem.attr("max")) + 1)) {
                                require(["jquery", "jquery-growl"], function ($) {
                                    $.growl.error({
                                        message: "Only numbers between " + $elem.attr("min")
                                                + " to " + $elem.attr("max")
                                                + " is allowed for " + $elem.closest('tr').find('td:first').text() + "!"
                                    });
                                });
                                $elem.val($elem.prop("defaultValue"));
                                return;
                            };

                            var levels = [];
                            $.each(table.rows().nodes(), function () {
                                var data = $(this).data('level');
                                if (data) {
                                    levels.push({
                                        color: data.stroke,
                                        dashStyle: data.dashStyle,
                                        width: data.strokeWidth,
                                        value: data.level,
                                        label: {
                                            text: data.level
                                        }
                                    });
                                }
                            });
                            var options = {
                                period: parseInt($html.find(".rocp_input_width_for_period").val()),
                                stroke: defaultStrokeColor,
                                strokeWidth: parseInt($html.find("#rocp_strokeWidth").val()),
                                dashStyle: selectedDashStyle,
                                appliedTo: parseInt($html.find("#rocp_appliedTo").val()),
                                levels: levels
                            };
                            before_add_callback && before_add_callback();
                            //Add ROCP for the main series
                            $($(".rocp").data('refererChartID')).highcharts().series[0].addIndicator('rocp', options);

                            closeDialog.call($html);
                        }
                    },
                    {
                        text: "Cancel",
                        click: function () {
                            closeDialog.call(this);
                        }
                    }
                ]
            });
            $html.find('select').each(function(index, value){
                $(value).selectmenu({
                    width : 150
                }).selectmenu("menuWidget").css("max-height","85px");
            });

            if (typeof _callback == "function") {
                _callback(containerIDWithHash);
            }

        });

    }

    return {

        open: function (containerIDWithHash, before_add_cb) {
            var open = function() {
                before_add_callback = before_add_cb;
                $(".rocp").data('refererChartID', containerIDWithHash).dialog( "open" );
            };
            if ($(".rocp").length == 0)
                init( containerIDWithHash, this.open );
            else
                open();
        }

    };

});
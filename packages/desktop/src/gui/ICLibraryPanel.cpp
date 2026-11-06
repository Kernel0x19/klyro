#include "gui/ICLibraryPanel.hpp"
#include "gui/SvgIcon.hpp"

#include <QHBoxLayout>
#include <QLineEdit>
#include <QStackedWidget>
#include <QToolButton>
#include <QTreeWidget>
#include <QTreeWidgetItem>
#include <QVBoxLayout>
#include <QLabel>
#include <QHBoxLayout>
#include <QColor>
#include <QSize>

namespace {
QToolButton* toolButton(const QString& text, const QString& name, QWidget* parent)
{
    auto* b = new QToolButton(parent);
    b->setText(text);
    b->setToolTip(name.left(1).toUpper() + name.mid(1));
    b->setObjectName("ToolButton_" + name);
    b->setCheckable(true);
    b->setAutoRaise(true);
    b->setFixedSize(34, 34);
    b->setCursor(Qt::PointingHandCursor);
    return b;
}

struct ICItem { const char* part; const char* description; };
const ICItem basicICs[] = {
    {"74LS00", "Quad 2-Input NAND"},
    {"74LS02", "Quad 2-Input NOR"},
    {"74LS03", "Quad 2-Input NAND OC"},
    {"74LS04", "Hex Inverter"},
    {"74LS05", "Hex Inverter OC"},
    {"74LS08", "Quad 2-Input AND"},
    {"74LS10", "Triple 3-Input NAND"},
    {"74LS11", "Triple 3-Input AND"},
    {"74LS14", "Hex Schmitt Inverter"},
    {"74LS20", "Dual 4-Input NAND"},
    {"74LS21", "Dual 4-Input AND"},
    {"74LS27", "Triple 3-Input NOR"},
    {"74LS30", "8-Input NAND"},
    {"74LS32", "Quad 2-Input OR"},
    {"74LS86", "Quad 2-Input XOR"},
    {"74LS132", "Quad 2-Input NAND Schmitt"}
};
}

ICLibraryPanel::ICLibraryPanel(QWidget* parent) : QWidget(parent)
{
    setObjectName("PanelSurface");
    setMinimumWidth(40);
    setMaximumWidth(224);

    auto* root = new QVBoxLayout(this);
    root->setContentsMargins(0, 0, 0, 0);
    root->setSpacing(0);

    m_stack = new QStackedWidget(this);
    m_expanded = buildExpanded();
    m_collapsedRail = buildCollapsed();
    m_stack->addWidget(m_expanded);
    m_stack->addWidget(m_collapsedRail);
    root->addWidget(m_stack);
    setCollapsed(false);
    setActiveTool("select");
}

QWidget* ICLibraryPanel::buildExpanded()
{
    auto* page = new QWidget(this);
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(0, 0, 0, 0);
    layout->setSpacing(0);

    auto* header = new QWidget(page);
    header->setObjectName("PanelHeader");
    auto* headerLayout = new QHBoxLayout(header);
    headerLayout->setContentsMargins(10, 6, 7, 6);
    auto* title = new QLabel("IC LIBRARY", header);
    title->setProperty("muted", true);
    title->setStyleSheet("font-size: 12px; font-weight: 800; letter-spacing: 1px;");
    headerLayout->addWidget(title);
    headerLayout->addStretch();
    auto* collapse = new QToolButton(header);
    collapse->setText("‹");
    collapse->setToolTip("Collapse IC library");
    collapse->setObjectName("IconButton");
    connect(collapse, &QToolButton::clicked, this, [this]() { setCollapsed(true); });
    headerLayout->addWidget(collapse);
    layout->addWidget(header);

    auto* searchHost = new QWidget(page);
    auto* searchLayout = new QVBoxLayout(searchHost);
    searchLayout->setContentsMargins(9, 8, 9, 8);
    m_search = new QLineEdit(searchHost);
    m_search->setPlaceholderText("⌕  Search ICs...");
    m_search->setClearButtonEnabled(true);
    connect(m_search, &QLineEdit::textChanged, this, &ICLibraryPanel::filterItems);
    searchLayout->addWidget(m_search);
    layout->addWidget(searchHost);

    m_tree = new QTreeWidget(page);
    m_tree->setObjectName("ICLibraryTree");
    m_tree->setHeaderHidden(true);
    m_tree->setColumnCount(1);
    m_tree->setIndentation(14);
    m_tree->setAnimated(true);
    m_tree->setUniformRowHeights(true);
    m_tree->setRootIsDecorated(true);
    auto* basic = new QTreeWidgetItem(m_tree, {"BASIC GATES"});
    basic->setExpanded(true);
    basic->setFlags(basic->flags() & ~Qt::ItemIsSelectable);
    for (const auto& ic : basicICs) {
        auto* item = new QTreeWidgetItem(basic);
        item->setData(0, Qt::UserRole, QString::fromLatin1(ic.part));
        item->setData(0, Qt::UserRole + 1, QString::fromLatin1(ic.description));
        item->setToolTip(0, QString("%1 — %2").arg(ic.part, ic.description));
        item->setSizeHint(0, QSize(0, 38));
        auto* row = new QWidget(m_tree);
        row->setAttribute(Qt::WA_TransparentForMouseEvents);
        auto* rowLayout = new QHBoxLayout(row);
        rowLayout->setContentsMargins(5, 1, 4, 1);
        rowLayout->setSpacing(6);
        auto* glyph = new QLabel("⚙", row);
        glyph->setStyleSheet("color: #4f6ef7; font-size: 11px;");
        rowLayout->addWidget(glyph);
        auto* labels = new QWidget(row);
        auto* labelsLayout = new QVBoxLayout(labels);
        labelsLayout->setContentsMargins(0, 0, 0, 0);
        labelsLayout->setSpacing(0);
        auto* partLabel = new QLabel(QString::fromLatin1(ic.part), labels);
        partLabel->setStyleSheet("font-size: 11px; font-weight: 800;");
        auto* descLabel = new QLabel(QString::fromLatin1(ic.description), labels);
        descLabel->setStyleSheet("font-size: 9px; color: palette(mid); ");
        labelsLayout->addWidget(partLabel);
        labelsLayout->addWidget(descLabel);
        rowLayout->addWidget(labels, 1);
        m_tree->setItemWidget(item, 0, row);
    }
    m_tree->expandAll();
    connect(m_tree, &QTreeWidget::itemClicked, this, &ICLibraryPanel::onItemClicked);
    layout->addWidget(m_tree, 1);

    auto* tools = new QWidget(page);
    tools->setObjectName("PanelHeader");
    auto* toolsLayout = new QHBoxLayout(tools);
    toolsLayout->setContentsMargins(7, 5, 7, 5);
    toolsLayout->setSpacing(5);
    const QList<QPair<QString, QString>> items = {
        {"select", ":/assets/icons/mousepointer.svg"},
        {"wire",   ":/assets/icons/wire.svg"},
        {"pan",    ":/assets/icons/pan.svg"},
        {"delete", ":/assets/icons/trash.svg"}
    };
    for (const auto& item : items) {
        auto* b = toolButton("", item.first, tools);
        b->setProperty("svgResource", item.second);
        b->setToolButtonStyle(Qt::ToolButtonIconOnly);
        b->setIconSize(QSize(18, 18));
        connect(b, &QToolButton::clicked, this,
                [this, id = item.first]() {
                    setActiveTool(id);
                });
        toolsLayout->addWidget(b);
    }
    layout->addWidget(tools);
    return page;
}

QWidget* ICLibraryPanel::buildCollapsed()
{
    auto* page = new QWidget(this);
    auto* layout = new QVBoxLayout(page);
    layout->setContentsMargins(3, 7, 3, 7);
    layout->setSpacing(7);

    auto* expand = new QToolButton(page);
    expand->setText("›");
    expand->setToolTip("Expand IC library");
    expand->setFixedSize(32, 32);
    connect(expand, &QToolButton::clicked, this, [this]() { setCollapsed(false); });
    layout->addWidget(expand, 0, Qt::AlignHCenter);

    auto* line = new QWidget(page);
    line->setFixedHeight(1);
    line->setStyleSheet("background: palette(mid);");
    layout->addWidget(line);

    const QList<QPair<QString, QString>> items = {
        {"select", ":/assets/icons/mousepointer.svg"},
        {"wire",   ":/assets/icons/wire.svg"},
        {"pan",    ":/assets/icons/pan.svg"},
        {"delete", ":/assets/icons/trash.svg"}
    };

    for (const auto& item : items)
    {
        auto* b = toolButton("", item.first, page);

        b->setProperty("svgResource", item.second);

        b->setToolButtonStyle(Qt::ToolButtonIconOnly);
        b->setIconSize(QSize(18, 18));

        connect(b, &QToolButton::clicked, this,
                [this, id = item.first]() {
                    setActiveTool(id);
                });

        layout->addWidget(b, 0, Qt::AlignHCenter);
    }
    layout->addStretch();
    return page;
}

void ICLibraryPanel::setCollapsed(bool collapsed)
{
    m_collapsed = collapsed;
    m_stack->setCurrentWidget(collapsed ? m_collapsedRail : m_expanded);
    setFixedWidth(collapsed ? 40 : 224);
    emit collapseChanged(collapsed);
}

void ICLibraryPanel::setDarkTheme(bool dark)
{
    m_dark = dark;

    const QColor normalColor = dark ? QColor("#8b8fa8") : QColor("#5a5f73");
    const QColor activeColor("#4f6ef7");

    for (QToolButton* button : findChildren<QToolButton*>())
    {
        if (!button->objectName().startsWith("ToolButton_"))
            continue;

        const QString resourcePath =
            button->property("svgResource").toString();

        if (resourcePath.isEmpty())
            continue;

        button->setIcon(
            makeStatefulSvgIcon(
                resourcePath,
                QSize(18, 18),
                normalColor,
                activeColor
                )
            );
    }
}

void ICLibraryPanel::filterItems(const QString& text)
{
    const QString query = text.trimmed().toLower();
    for (int g = 0; g < m_tree->topLevelItemCount(); ++g) {
        QTreeWidgetItem* group = m_tree->topLevelItem(g);
        bool anyVisible = false;
        for (int i = 0; i < group->childCount(); ++i) {
            QTreeWidgetItem* item = group->child(i);
            const bool match = query.isEmpty()
                || item->text(0).toLower().contains(query)
                || item->data(0, Qt::UserRole + 1).toString().toLower().contains(query);
            item->setHidden(!match);
            anyVisible = anyVisible || match;
        }
        group->setHidden(!anyVisible);
        group->setExpanded(true);
    }
}

void ICLibraryPanel::onItemClicked(QTreeWidgetItem* item, int column)
{
    Q_UNUSED(column);
    const QString part = item->data(0, Qt::UserRole).toString();
    if (!part.isEmpty()) {
        emit icPicked(part, item->data(0, Qt::UserRole + 1).toString());
    }
}

void ICLibraryPanel::setActiveTool(const QString& toolName)
{
    m_activeTool = toolName;
    for (QToolButton* b : findChildren<QToolButton*>()) {
        if (b->objectName().startsWith("ToolButton_")) {
            b->setChecked(b->objectName() == "ToolButton_" + toolName);
        }
    }
    emit toolChanged(toolName);
}
